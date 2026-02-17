"use server";

import { revalidatePath } from "next/cache";

import { createActionSchema } from "@/lib/validations/action";
import { createModerationAction } from "@/lib/services/action";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function createModerationActionAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.ACTIONS_CREATE);

  const evidenceRaw = String(formData.get("evidenceUrls") ?? "");
  const evidenceUrls = evidenceRaw
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const parsed = createActionSchema.safeParse({
    type: formData.get("type"),
    playerId: formData.get("playerId"),
    reason: formData.get("reason"),
    durationMinutes: formData.get("durationMinutes") || undefined,
    evidenceUrls,
    caseId: formData.get("caseId") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid action payload.",
    };
  }

  if (parsed.data.type === "TEMP_BAN" || parsed.data.type === "PERM_BAN") {
    await requirePermission(Permission.BANS_CREATE);
  }

  await createModerationAction({
    communityId: user.communityId,
    type: parsed.data.type,
    playerId: parsed.data.playerId,
    moderatorUserId: user.id,
    reason: parsed.data.reason,
    durationMinutes: parsed.data.durationMinutes,
    evidenceUrls: parsed.data.evidenceUrls,
    caseId: parsed.data.caseId,
  });

  revalidatePath("/app/actions");
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/players/${parsed.data.playerId}`);
  if (parsed.data.caseId) {
    revalidatePath(`/app/cases/${parsed.data.caseId}`);
    revalidatePath("/app/cases");
  }

  return { success: true, message: "Moderation action recorded." };
}
