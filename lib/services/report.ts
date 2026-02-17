import { Prisma, ReportStatus } from "@prisma/client";

import { clampTake, toCursorPage } from "@/lib/db/pagination";
import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

interface CreateReportInput {
  communityId: string;
  reporterName?: string;
  reporterContact?: string;
  accusedPlayerId?: string;
  summary: string;
  status?: ReportStatus;
  actorUserId: string;
}

interface UpdateReportStatusInput {
  communityId: string;
  reportId: string;
  status: ReportStatus;
  actorUserId: string;
}

interface AssignReportInput {
  communityId: string;
  reportId: string;
  assignedToUserId: string | null;
  actorUserId: string;
}

export async function createReport(input: CreateReportInput) {
  if (input.accusedPlayerId) {
    const player = await prisma.player.findFirst({
      where: { id: input.accusedPlayerId, communityId: input.communityId },
      select: { id: true },
    });
    if (!player) {
      await logTenantViolationIfExists({
        actorUserId: input.actorUserId,
        actorCommunityId: input.communityId,
        resource: "player",
        resourceId: input.accusedPlayerId,
        operation: "write",
      });
      throw new Error("Accused player not found.");
    }
  }

  const report = await prisma.report.create({
    data: {
      communityId: input.communityId,
      reporterName: input.reporterName || null,
      reporterContact: input.reporterContact || null,
      accusedPlayerId: input.accusedPlayerId || null,
      summary: input.summary,
      status: input.status ?? "OPEN",
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.REPORT_CREATED,
    metadata: { reportId: report.id, status: report.status },
  });

  return report;
}

export async function updateReportStatus(input: UpdateReportStatusInput) {
  const updated = await prisma.report.updateMany({
    where: { id: input.reportId, communityId: input.communityId },
    data: { status: input.status },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "report",
      resourceId: input.reportId,
      operation: "write",
    });
    throw new Error("Report not found.");
  }

  const report = await prisma.report.findFirst({
    where: { id: input.reportId, communityId: input.communityId },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.REPORT_STATUS_UPDATED,
    metadata: { reportId: input.reportId, status: input.status },
  });

  return report;
}

export async function assignReport(input: AssignReportInput) {
  const updated = await prisma.report.updateMany({
    where: { id: input.reportId, communityId: input.communityId },
    data: { assignedToUserId: input.assignedToUserId },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "report",
      resourceId: input.reportId,
      operation: "write",
    });
    throw new Error("Report not found.");
  }

  const report = await prisma.report.findFirst({
    where: { id: input.reportId, communityId: input.communityId },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.REPORT_ASSIGNED,
    metadata: { reportId: input.reportId, assignedToUserId: input.assignedToUserId },
  });

  return report;
}

export async function listReports(input: {
  communityId: string;
  status?: ReportStatus | null;
  assignedToUserId?: string | null;
  take?: number;
  cursor?: string | null;
}) {
  const where: Record<string, unknown> = { communityId: input.communityId };
  if (input.status) where.status = input.status;
  if (typeof input.assignedToUserId !== "undefined") {
    where.assignedToUserId = input.assignedToUserId;
  }

  const take = clampTake(input.take, { defaultTake: 70, maxTake: 200 });

  const cursor = input.cursor?.trim() ? input.cursor.trim() : null;

  const args = {
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      accusedPlayer: {
        select: { id: true, name: true, status: true },
      },
      case: {
        select: { id: true, title: true, status: true },
      },
      assignedToUser: {
        select: { id: true, name: true, role: true },
      },
    },
  } satisfies Prisma.ReportFindManyArgs;

  const rows = await prisma.report.findMany(args);

  return toCursorPage(rows, take);
}

export async function getReportById(input: { communityId: string; id: string }) {
  return prisma.report.findFirst({
    where: { id: input.id, communityId: input.communityId },
    include: {
      accusedPlayer: {
        select: { id: true, name: true, status: true },
      },
      case: {
        select: { id: true, title: true, status: true },
      },
      assignedToUser: {
        select: { id: true, name: true, role: true },
      },
    },
  });
}

export async function getOpenReportCount(input: { communityId: string }) {
  return prisma.report.count({ where: { communityId: input.communityId, status: "OPEN" } });
}
