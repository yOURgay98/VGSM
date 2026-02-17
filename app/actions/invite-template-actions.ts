"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { createInviteTemplate } from "@/lib/services/invite";
import { prisma } from "@/lib/db";

type Result = { ok: boolean; message: string };

function toInt(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const val = Number.parseInt(trimmed, 10);
  return Number.isFinite(val) ? val : null;
}

export async function createInviteTemplateAction(
  _prev: Result,
  formData: FormData,
): Promise<Result> {
  const actor = await requirePermission(Permission.USERS_INVITE);

  const name = String(formData.get("name") ?? "").trim();
  const defaultRoleId = String(formData.get("defaultRoleId") ?? "").trim();
  const expiresInMinutes = toInt(formData.get("expiresInMinutes"));
  const maxUses = toInt(formData.get("maxUses"));
  const require2fa = Boolean(formData.get("require2fa"));
  const requireApproval = Boolean(formData.get("requireApproval"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (name.length < 2 || name.length > 60) {
    return { ok: false, message: "Template name must be 2-60 characters." };
  }
  if (!defaultRoleId) {
    return { ok: false, message: "Default role is required." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  try {
    await createInviteTemplate({
      communityId: actor.communityId,
      name,
      defaultRoleId,
      expiresInMinutes,
      maxUses,
      require2fa,
      requireApproval,
      notes,
      actorUserId: actor.id,
      ip,
      userAgent,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create template.",
    };
  }

  revalidatePath("/app/settings/invites");
  return { ok: true, message: "Template created." };
}

export async function deleteInviteTemplateAction(templateId: string) {
  const actor = await requirePermission(Permission.USERS_INVITE);

  const tpl = await prisma.inviteTemplate.findFirst({
    where: { id: templateId, communityId: actor.communityId },
    select: { id: true },
  });
  if (!tpl) {
    throw new Error("Template not found.");
  }

  // If templates are actively referenced by invites, keep it simple: allow deletion but
  // existing invites will have templateId set null via FK onDelete SetNull.
  await prisma.inviteTemplate.deleteMany({
    where: { id: templateId, communityId: actor.communityId },
  });

  revalidatePath("/app/settings/invites");
  // Form actions should return void.
}
