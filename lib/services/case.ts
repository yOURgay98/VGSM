import { CaseStatus, Prisma } from "@prisma/client";

import { clampTake, toCursorPage } from "@/lib/db/pagination";
import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

interface CreateCaseInput {
  communityId: string;
  title: string;
  description: string;
  status?: CaseStatus;
  assignedToUserId?: string;
  playerIds?: string[];
  reportIds?: string[];
  actorUserId: string;
}

interface AddCaseCommentInput {
  communityId: string;
  caseId: string;
  userId: string;
  body: string;
}

interface UpdateCaseStatusInput {
  communityId: string;
  caseId: string;
  status: CaseStatus;
  actorUserId: string;
}

export async function createCaseRecord(input: CreateCaseInput) {
  if (input.assignedToUserId) {
    const membership = await prisma.communityMembership.findUnique({
      where: {
        communityId_userId: { communityId: input.communityId, userId: input.assignedToUserId },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new Error("Assigned staff member is not part of this community.");
    }
  }

  if (input.playerIds?.length) {
    const count = await prisma.player.count({
      where: { communityId: input.communityId, id: { in: input.playerIds } },
    });
    if (count !== input.playerIds.length) {
      throw new Error("One or more players are not part of this community.");
    }
  }

  if (input.reportIds?.length) {
    const count = await prisma.report.count({
      where: { communityId: input.communityId, id: { in: input.reportIds } },
    });
    if (count !== input.reportIds.length) {
      throw new Error("One or more reports are not part of this community.");
    }
  }

  const caseRecord = await prisma.case.create({
    data: {
      communityId: input.communityId,
      title: input.title,
      description: input.description,
      status: input.status ?? "OPEN",
      assignedToUserId: input.assignedToUserId || null,
      casePlayers: input.playerIds?.length
        ? {
            createMany: {
              data: input.playerIds.map((playerId) => ({ playerId })),
              skipDuplicates: true,
            },
          }
        : undefined,
      reports: input.reportIds?.length
        ? {
            connect: input.reportIds.map((id) => ({ id })),
          }
        : undefined,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.CASE_CREATED,
    metadata: {
      caseId: caseRecord.id,
      assignedToUserId: input.assignedToUserId,
      players: input.playerIds,
      reports: input.reportIds,
    },
  });

  return caseRecord;
}

export async function updateCaseStatus(input: UpdateCaseStatusInput) {
  const updated = await prisma.case.updateMany({
    where: { id: input.caseId, communityId: input.communityId },
    data: { status: input.status },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "case",
      resourceId: input.caseId,
      operation: "write",
    });
    throw new Error("Case not found.");
  }

  const caseRecord = await prisma.case.findFirst({
    where: { id: input.caseId, communityId: input.communityId },
  });

  if (!caseRecord) {
    throw new Error("Case not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.CASE_UPDATED,
    metadata: {
      caseId: input.caseId,
      status: input.status,
    },
  });

  return caseRecord;
}

export async function addCaseComment(input: AddCaseCommentInput) {
  const exists = await prisma.case.findFirst({
    where: { id: input.caseId, communityId: input.communityId },
    select: { id: true },
  });

  if (!exists) {
    await logTenantViolationIfExists({
      actorUserId: input.userId,
      actorCommunityId: input.communityId,
      resource: "case",
      resourceId: input.caseId,
      operation: "write",
    });
    throw new Error("Case not found.");
  }

  const comment = await prisma.comment.create({
    data: {
      communityId: input.communityId,
      caseId: input.caseId,
      userId: input.userId,
      body: input.body,
    },
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.userId,
    eventType: AuditEvent.CASE_COMMENTED,
    metadata: {
      caseId: input.caseId,
      commentId: comment.id,
    },
  });

  return comment;
}

export async function listCases(input: {
  communityId: string;
  status?: CaseStatus | null;
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
    orderBy: { createdAt: "desc" },
    include: {
      assignedToUser: { select: { id: true, name: true, role: true } },
      casePlayers: {
        include: {
          player: { select: { id: true, name: true, status: true } },
        },
      },
      caseActions: {
        include: {
          action: { select: { id: true, type: true, createdAt: true } },
        },
      },
      reports: {
        select: { id: true, status: true },
      },
      comments: {
        select: { id: true },
      },
    },
  } satisfies Prisma.CaseFindManyArgs;

  const rows = await prisma.case.findMany(args);

  return toCursorPage(rows, take);
}

export async function getCaseById(input: { communityId: string; id: string }) {
  return prisma.case.findFirst({
    where: { id: input.id, communityId: input.communityId },
    include: {
      assignedToUser: { select: { id: true, name: true, role: true } },
      casePlayers: {
        include: {
          player: { select: { id: true, name: true, status: true } },
        },
      },
      caseActions: {
        include: {
          action: {
            include: {
              player: { select: { id: true, name: true } },
              moderatorUser: { select: { id: true, name: true, role: true } },
            },
          },
        },
      },
      comments: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reports: {
        include: {
          accusedPlayer: { select: { id: true, name: true } },
        },
      },
    },
  });
}
