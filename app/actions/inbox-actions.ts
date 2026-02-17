"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { assignReport } from "@/lib/services/report";
import { logTenantViolationIfExists } from "@/lib/services/tenant";
import { Permission } from "@/lib/security/permissions";

export async function assignReportToMeAction(reportId: string) {
  const user = await requirePermission(Permission.REPORTS_TRIAGE);

  await assignReport({
    communityId: user.communityId,
    reportId,
    assignedToUserId: user.id,
    actorUserId: user.id,
  });

  revalidatePath("/app/reports");
  revalidatePath("/app/inbox");
  revalidatePath("/app/dashboard");
  return { ok: true } as const;
}

export async function assignCaseToMeAction(caseId: string) {
  const user = await requirePermission(Permission.CASES_ASSIGN);

  const updated = await prisma.case.updateMany({
    where: { id: caseId, communityId: user.communityId },
    data: { assignedToUserId: user.id },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: user.id,
      actorCommunityId: user.communityId,
      resource: "case",
      resourceId: caseId,
      operation: "write",
    });
    throw new Error("Case not found.");
  }

  await createAuditLog({
    communityId: user.communityId,
    userId: user.id,
    eventType: AuditEvent.CASE_UPDATED,
    metadata: { caseId, assignedToUserId: user.id },
  });

  revalidatePath("/app/cases");
  revalidatePath("/app/inbox");
  revalidatePath("/app/dashboard");
  return { ok: true } as const;
}
