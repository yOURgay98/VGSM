"use server";

import { revalidatePath } from "next/cache";

import { createReportSchema, updateReportStatusSchema } from "@/lib/validations/report";
import { createReport, updateReportStatus } from "@/lib/services/report";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function createReportAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.REPORTS_TRIAGE);

  const parsed = createReportSchema.safeParse({
    reporterName: formData.get("reporterName"),
    reporterContact: formData.get("reporterContact"),
    accusedPlayerId: formData.get("accusedPlayerId") || undefined,
    summary: formData.get("summary"),
    status: formData.get("status") || "OPEN",
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid report payload.",
    };
  }

  await createReport({
    ...parsed.data,
    communityId: user.communityId,
    actorUserId: user.id,
  });

  revalidatePath("/app/reports");
  revalidatePath("/app/dashboard");

  return { success: true, message: "Report added." };
}

export async function updateReportStatusAction(
  reportId: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.REPORTS_TRIAGE);

  const parsed = updateReportStatusSchema.safeParse({
    reportId,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid status payload.",
    };
  }

  if (parsed.data.status === "RESOLVED" || parsed.data.status === "REJECTED") {
    await requirePermission(Permission.REPORTS_RESOLVE);
  }

  await updateReportStatus({
    communityId: user.communityId,
    reportId: parsed.data.reportId,
    status: parsed.data.status,
    actorUserId: user.id,
  });

  revalidatePath("/app/reports");
  revalidatePath("/app/dashboard");

  return { success: true, message: "Report status updated." };
}
