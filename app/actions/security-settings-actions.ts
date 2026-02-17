"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/services/auth";
import { updateSecuritySettings } from "@/lib/services/security-settings";
import { securitySettingsSchema } from "@/lib/validations/security";
import { Permission } from "@/lib/security/permissions";
import { getSecuritySettings } from "@/lib/services/security-settings";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function updateSecuritySettingsAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.SETTINGS_EDIT);

  const parsed = securitySettingsSchema.safeParse({
    require2FAForPrivileged: formData.get("require2FAForPrivileged"),
    twoPersonRule: formData.get("twoPersonRule"),
    requireSensitiveModeForHighRisk: formData.get("requireSensitiveModeForHighRisk"),
    sensitiveModeTtlMinutes: formData.get("sensitiveModeTtlMinutes"),
    highRiskCommandCooldownSeconds: formData.get("highRiskCommandCooldownSeconds"),
    betaAccessEnabled: formData.get("betaAccessEnabled"),
    autoFreezeEnabled: formData.get("autoFreezeEnabled"),
    autoFreezeThreshold: formData.get("autoFreezeThreshold"),
    lockoutMaxAttempts: formData.get("lockoutMaxAttempts"),
    lockoutWindowMinutes: formData.get("lockoutWindowMinutes"),
    lockoutDurationMinutes: formData.get("lockoutDurationMinutes"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid security settings payload.",
    };
  }

  const current = await getSecuritySettings(user.communityId);
  if (current.betaAccessEnabled !== parsed.data.betaAccessEnabled && user.role !== "OWNER") {
    return { success: false, message: "Only OWNER can change access key settings." };
  }

  if (parsed.data.autoFreezeEnabled && user.role !== "OWNER") {
    return { success: false, message: "Only OWNER can enable auto-freeze." };
  }

  await updateSecuritySettings({
    actorUserId: user.id,
    communityId: user.communityId,
    payload: parsed.data,
  });

  revalidatePath("/app/settings");
  revalidatePath("/login");

  return { success: true, message: "Security settings updated." };
}
