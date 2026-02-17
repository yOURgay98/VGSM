"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/services/auth";
import { assignRoleToUser, updateGeneralSettings } from "@/lib/services/settings";
import { generalSettingsSchema, roleAssignmentSchema } from "@/lib/validations/settings";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function updateGeneralSettingsAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.SETTINGS_EDIT);

  const presets = String(formData.get("tempBanPresets") ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  const parsed = generalSettingsSchema.safeParse({
    communityName: formData.get("communityName"),
    theme: formData.get("theme"),
    tempBanPresets: presets,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid settings payload.",
    };
  }

  await updateGeneralSettings({
    actorUserId: user.id,
    communityId: user.communityId,
    payload: parsed.data,
  });

  revalidatePath("/app/settings");

  return { success: true, message: "Settings updated." };
}

export async function assignRoleAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.USERS_EDIT_ROLE);

  const parsed = roleAssignmentSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid role payload." };
  }

  await assignRoleToUser({
    actorUserId: user.id,
    actorRole: user.role,
    targetUserId: parsed.data.targetUserId,
    role: parsed.data.role,
  });

  revalidatePath("/app/settings");

  return { success: true, message: "Role updated." };
}
