import { ApprovalStatus, CaseStatus, PlayerStatus, ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export async function listModerationDesk(input: { communityId: string }) {
  const [reports, cases, flaggedPlayers, approvals, macros] = await Promise.all([
    prisma.report.findMany({
      where: {
        communityId: input.communityId,
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 120,
      include: {
        accusedPlayer: { select: { id: true, name: true, status: true } },
        assignedToUser: { select: { id: true, name: true, role: true } },
        case: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.case.findMany({
      where: {
        communityId: input.communityId,
        status: { in: [CaseStatus.OPEN, CaseStatus.IN_REVIEW] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 120,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        assignedToUserId: true,
        createdAt: true,
        updatedAt: true,
        assignedToUser: { select: { id: true, name: true, role: true } },
        reports: { select: { id: true } },
        casePlayers: { select: { player: { select: { id: true, name: true, status: true } } } },
      },
    }),
    prisma.player.findMany({
      where: {
        communityId: input.communityId,
        status: PlayerStatus.WATCHED,
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        actions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, type: true, createdAt: true, reason: true },
        },
      },
    }),
    prisma.approvalRequest.findMany({
      where: { communityId: input.communityId, status: ApprovalStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        requestedByUser: { select: { id: true, name: true, role: true } },
        payloadJson: true,
      },
    }),
    prisma.moderationMacro.findMany({
      where: { communityId: input.communityId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        templateText: true,
        createdAt: true,
      },
    }),
  ]);

  return { reports, cases, flaggedPlayers, approvals, macros };
}

export async function createModerationMacro(input: {
  communityId: string;
  actorUserId: string;
  name: string;
  type: "REPORT_RESOLUTION" | "NOTE" | "WARNING" | "BAN_REASON";
  templateText: string;
}) {
  const macro = await prisma.moderationMacro.create({
    data: {
      communityId: input.communityId,
      createdByUserId: input.actorUserId,
      name: input.name,
      type: input.type,
      templateText: input.templateText,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MODERATION_MACRO_CREATED,
    metadata: {
      macroId: macro.id,
      name: macro.name,
      type: macro.type,
    },
  });

  return macro;
}

export async function deleteModerationMacro(input: {
  communityId: string;
  actorUserId: string;
  macroId: string;
}) {
  const deleted = await prisma.moderationMacro.deleteMany({
    where: { id: input.macroId, communityId: input.communityId },
  });

  if (deleted.count !== 1) {
    throw new Error("Macro not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MODERATION_MACRO_DELETED,
    metadata: {
      macroId: input.macroId,
    },
  });
}
