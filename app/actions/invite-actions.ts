"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { createInviteSchema } from "@/lib/validations/invite";
import { redeemInviteSchema } from "@/lib/validations/auth";
import { createInvite, redeemInvite, revokeInvite } from "@/lib/services/invite";
import { requirePermission, requireSessionUser } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
import { redeemInviteJoinSchema } from "@/lib/validations/auth";
import { getCurrentSessionToken } from "@/lib/services/session";
import { prisma } from "@/lib/db";

const inviteRedeemLimiter = new InMemoryRateLimiter(8, 10 * 60_000);
const betaRedeemLimiter = new InMemoryRateLimiter(10, 10 * 60_000);

interface MutationResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  fieldErrors?: Partial<
    Record<"roleId" | "templateId" | "expiresAt" | "maxUses" | "require2fa" | "requireApproval", string>
  >;
}

function toFieldErrors(error: z.ZodError): MutationResult["fieldErrors"] {
  const fieldErrors: MutationResult["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

function firstHeaderValue(value: string | null) {
  if (!value) return null;
  const first = value.split(",")[0];
  return first ? first.trim() : null;
}

function requestOriginFromHeaders(requestHeaders: Headers) {
  const forwardedProto = firstHeaderValue(requestHeaders.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(requestHeaders.get("x-forwarded-host"));
  const host = forwardedHost ?? requestHeaders.get("host");
  const proto = forwardedProto ?? "https";
  if (host) {
    return `${proto}://${host}`;
  }

  // Fallbacks for non-request contexts.
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function createInviteAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.USERS_INVITE);

  const parsed = createInviteSchema.safeParse({
    roleId: formData.get("roleId"),
    templateId: formData.get("templateId"),
    expiresAt: formData.get("expiresAt"),
    maxUses: formData.get("maxUses"),
    require2fa: formData.get("require2fa") ? true : false,
    requireApproval: formData.get("requireApproval") ? true : false,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please review the invite form.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");

  const templateId = parsed.data.templateId ? String(parsed.data.templateId).trim() : null;
  const roleId = parsed.data.roleId ? String(parsed.data.roleId).trim() : null;

  if (templateId) {
    const template = await prisma.inviteTemplate.findFirst({
      where: { id: templateId, communityId: user.communityId },
      select: { id: true, defaultRoleId: true },
    });
    if (!template) {
      return {
        success: false,
        message: "Template is missing required fields or was removed.",
        fieldErrors: { templateId: "Please select a valid template." },
      };
    }
    if (!template.defaultRoleId && !roleId) {
      return {
        success: false,
        message: "Selected template has no default role.",
        fieldErrors: { templateId: "Template must define a default role." },
      };
    }
  }

  if (roleId) {
    const role = await prisma.communityRole.findFirst({
      where: { id: roleId, communityId: user.communityId },
      select: { id: true },
    });
    if (!role) {
      return {
        success: false,
        message: "Selected role is no longer available.",
        fieldErrors: { roleId: "Please select a valid role." },
      };
    }
  }

  let invite: Awaited<ReturnType<typeof createInvite>>;
  try {
    invite = await createInvite({
      communityId: user.communityId,
      roleId: roleId || null,
      templateId: templateId || null,
      maxUses: parsed.data.maxUses,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      require2fa: Boolean(parsed.data.require2fa),
      requireApproval: Boolean(parsed.data.requireApproval),
      createdByUserId: user.id,
      ip,
      userAgent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create invite.";
    if (message.includes("Role not found")) {
      return {
        success: false,
        message: "Selected role is no longer available.",
        fieldErrors: { roleId: "Please select a valid role." },
      };
    }
    if (message.includes("specify a role or template")) {
      return {
        success: false,
        message: "Please select a template or role.",
        fieldErrors: { templateId: "Please select a template.", roleId: "Please select a role." },
      };
    }
    return {
      success: false,
      message: "Unable to create invite right now. Please retry.",
    };
  }

  revalidatePath("/app/settings/invites");

  return {
    success: true,
    message: "Invite created.",
    data: {
      token: invite.token,
      inviteUrl: `${requestOriginFromHeaders(requestHeaders)}/invite/${invite.token}`,
    },
  };
}

export async function redeemInviteAction(
  token: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const parsed = redeemInviteSchema.safeParse({
    token,
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    betaKey: formData.get("betaKey"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "unknown";

  const rate = inviteRedeemLimiter.check(`${ip}:${parsed.data.email}`);
  if (!rate.allowed) {
    return { success: false, message: "Too many invite attempts. Try again in a few minutes." };
  }

  const betaRate = betaRedeemLimiter.check(`${ip}:beta:${parsed.data.email}`);
  if (!betaRate.allowed) {
    return { success: false, message: "Too many access key attempts. Try again in a few minutes." };
  }

  try {
    const result = await redeemInvite({
      token: parsed.data.token,
      email: parsed.data.email,
      name: parsed.data.name,
      password: parsed.data.password,
      betaKey: parsed.data.betaKey ?? null,
      ip,
      userAgent: requestHeaders.get("user-agent"),
    });

    return {
      success: true,
      message: result.requireApproval
        ? "Account created. Access is pending approval by community staff."
        : "Account created. You can now sign in.",
      data: { requireApproval: result.requireApproval },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Invite redemption failed.",
    };
  }
}

export async function redeemInviteJoinAction(
  token: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requireSessionUser();

  const parsed = redeemInviteJoinSchema.safeParse({
    token,
    betaKey: formData.get("betaKey"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "unknown";

  const betaRate = betaRedeemLimiter.check(`${ip}:beta:${user.id}`);
  if (!betaRate.allowed) {
    return { success: false, message: "Too many access key attempts. Try again in a few minutes." };
  }

  try {
    const result = await redeemInvite({
      token: parsed.data.token,
      email: user.email,
      name: user.name,
      password: null,
      existingUserId: user.id,
      betaKey: parsed.data.betaKey ?? null,
      ip,
      userAgent: requestHeaders.get("user-agent"),
    });

    revalidatePath("/app");
    revalidatePath("/onboarding");

    if (!result.requireApproval) {
      const sessionToken = await getCurrentSessionToken();
      if (sessionToken) {
        await prisma.session.updateMany({
          where: { sessionToken, userId: user.id },
          data: { activeCommunityId: result.communityId },
        });
      }
    }

    return {
      success: true,
      message: result.requireApproval
        ? "Join request submitted. Access is pending approval by community staff."
        : "Invite redeemed. You now have access to this community.",
      data: { requireApproval: result.requireApproval, communityId: result.communityId },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Invite redemption failed.",
    };
  }
}

export async function revokeInviteAction(inviteId: string) {
  const actor = await requirePermission(Permission.USERS_INVITE);
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent");

  try {
    await revokeInvite({
      communityId: actor.communityId,
      inviteId,
      actorUserId: actor.id,
      ip,
      userAgent,
    });
  } catch {
    // Best-effort; avoid server action crashes on already-revoked or missing records.
  }

  revalidatePath("/app/settings/invites");
}
