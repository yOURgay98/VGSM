import { ActionType, Prisma } from "@prisma/client";

import { clampTake, toCursorPage } from "@/lib/db/pagination";
import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

interface CreateModerationActionInput {
  communityId: string;
  type: ActionType;
  playerId: string;
  moderatorUserId: string;
  reason: string;
  durationMinutes?: number;
  evidenceUrls?: string[];
  caseId?: string;
}

export async function createModerationAction(input: CreateModerationActionInput) {
  if (input.type === "TEMP_BAN" && !input.durationMinutes) {
    throw new Error("TEMP_BAN requires a duration.");
  }

  const player = await prisma.player.findFirst({
    where: { id: input.playerId, communityId: input.communityId },
    select: { id: true },
  });
  if (!player) {
    await logTenantViolationIfExists({
      actorUserId: input.moderatorUserId,
      actorCommunityId: input.communityId,
      resource: "player",
      resourceId: input.playerId,
      operation: "write",
    });
    throw new Error("Player not found.");
  }

  if (input.caseId) {
    const c = await prisma.case.findFirst({
      where: { id: input.caseId, communityId: input.communityId },
      select: { id: true },
    });
    if (!c) {
      await logTenantViolationIfExists({
        actorUserId: input.moderatorUserId,
        actorCommunityId: input.communityId,
        resource: "case",
        resourceId: input.caseId,
        operation: "write",
      });
      throw new Error("Case not found.");
    }
  }

  const action = await prisma.action.create({
    data: {
      communityId: input.communityId,
      type: input.type,
      playerId: input.playerId,
      moderatorUserId: input.moderatorUserId,
      reason: input.reason,
      durationMinutes: input.type === "TEMP_BAN" ? input.durationMinutes : null,
      evidenceUrls: input.evidenceUrls ?? [],
    },
  });

  if (input.caseId) {
    await prisma.caseAction.create({
      data: {
        caseId: input.caseId,
        actionId: action.id,
      },
    });
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.moderatorUserId,
    eventType: AuditEvent.ACTION_CREATED,
    metadata: {
      actionId: action.id,
      playerId: action.playerId,
      type: action.type,
      caseId: input.caseId,
    },
  });

  return action;
}

export async function listActions(input: {
  communityId: string;
  take?: number;
  cursor?: string | null;
}) {
  const take = clampTake(input.take, { defaultTake: 60, maxTake: 200 });

  const cursor = input.cursor?.trim() ? input.cursor.trim() : null;

  const args = {
    take: take + 1,
    where: { communityId: input.communityId },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      player: { select: { id: true, name: true } },
      moderatorUser: { select: { id: true, name: true, role: true } },
      caseActions: {
        include: {
          case: { select: { id: true, title: true } },
        },
      },
    },
  } satisfies Prisma.ActionFindManyArgs;

  const rows = await prisma.action.findMany(args);

  return toCursorPage(rows, take);
}

export async function getRecentActions(input: { communityId: string; limit?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 6, 1), 50);
  return prisma.action.findMany({
    take: limit,
    where: { communityId: input.communityId },
    orderBy: { createdAt: "desc" },
    include: {
      player: { select: { id: true, name: true } },
      moderatorUser: { select: { id: true, name: true } },
    },
  });
}

export async function getStaffActivity(input: { communityId: string; days?: number }) {
  const days = Math.min(Math.max(input.days ?? 7, 1), 60);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await prisma.action.groupBy({
    by: ["moderatorUserId"],
    where: { communityId: input.communityId, createdAt: { gte: since } },
    _count: { _all: true },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: records.map((record) => record.moderatorUserId) } },
    select: { id: true, name: true },
  });

  return records
    .map((record) => ({
      userId: record.moderatorUserId,
      count: record._count._all,
      userName: users.find((user) => user.id === record.moderatorUserId)?.name ?? "Unknown",
    }))
    .sort((a, b) => b.count - a.count);
}
