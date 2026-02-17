"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { createBetaAccessKey, revokeBetaAccessKey } from "@/lib/services/beta-keys";

type MutationResult =
  | { success: true; message: string; data?: Record<string, unknown> }
  | { success: false; message: string };

const createBetaKeySchema = z
  .object({
    label: z.string().trim().max(80).optional().nullable(),
    maxUses: z.coerce.number().int().min(1).max(500).default(1),
    expiresAt: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val ? val : null)),
  })
  .strict();

export async function createBetaKeyAction(
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  if (actor.membership.role.name !== "OWNER") {
    return { success: false, message: "Only OWNER can manage access keys." };
  }
  const parsed = createBetaKeySchema.safeParse({
    label: formData.get("label"),
    maxUses: formData.get("maxUses"),
    expiresAt: formData.get("expiresAt"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid access key payload.",
    };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  const expiresAt =
    parsed.data.expiresAt && !Number.isNaN(Date.parse(parsed.data.expiresAt))
      ? new Date(parsed.data.expiresAt)
      : null;

  try {
    const created = await createBetaAccessKey({
      communityId: actor.communityId,
      actorUserId: actor.id,
      label: parsed.data.label ?? null,
      maxUses: parsed.data.maxUses,
      expiresAt,
      ip,
      userAgent,
    });

    revalidatePath("/app/settings/access-keys");
    revalidatePath("/app/settings/beta-keys");
    revalidatePath("/app/settings");

    return {
      success: true,
      message: "Access key created. Copy it now; it will not be shown again.",
      data: {
        id: created.id,
        key: created.key,
        maxUses: created.maxUses,
        expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create access key.",
    };
  }
}

export async function revokeBetaKeyAction(
  betaKeyId: string,
  _formData?: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  if (actor.membership.role.name !== "OWNER") {
    return { success: false, message: "Only OWNER can manage access keys." };
  }
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  try {
    await revokeBetaAccessKey({
      communityId: actor.communityId,
      actorUserId: actor.id,
      betaKeyId,
      ip,
      userAgent,
    });

    revalidatePath("/app/settings/access-keys");
    revalidatePath("/app/settings/beta-keys");
    revalidatePath("/app/settings");

    return { success: true, message: "Access key revoked." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to revoke access key.",
    };
  }
}
