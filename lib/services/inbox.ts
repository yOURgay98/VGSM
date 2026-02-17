import { ApprovalStatus, CaseStatus, ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function listInbox(input: { communityId: string }) {
  const [reports, cases, approvals] = await Promise.all([
    prisma.report.findMany({
      where: {
        communityId: input.communityId,
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
        assignedToUserId: null,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      include: { accusedPlayer: { select: { id: true, name: true, status: true } } },
    }),
    prisma.case.findMany({
      where: {
        communityId: input.communityId,
        status: { in: [CaseStatus.OPEN, CaseStatus.IN_REVIEW] },
        assignedToUserId: null,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        casePlayers: { select: { playerId: true } },
        reports: { select: { id: true } },
      },
    }),
    prisma.approvalRequest.findMany({
      where: { communityId: input.communityId, status: ApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requestedByUser: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  return { reports, cases, approvals };
}
