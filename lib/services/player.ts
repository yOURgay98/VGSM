import { PlayerStatus, Prisma } from "@prisma/client";

import { clampTake, toCursorPage } from "@/lib/db/pagination";
import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

interface CreatePlayerInput {
  communityId: string;
  name: string;
  robloxId?: string;
  discordId?: string;
  status?: PlayerStatus;
  notes?: string;
  actorUserId: string;
}

interface UpdatePlayerInput {
  communityId: string;
  playerId: string;
  status?: PlayerStatus;
  notes?: string;
  actorUserId: string;
}

export async function createPlayer(input: CreatePlayerInput) {
  const player = await prisma.player.create({
    data: {
      communityId: input.communityId,
      name: input.name,
      robloxId: input.robloxId || null,
      discordId: input.discordId || null,
      status: input.status ?? "ACTIVE",
      notes: input.notes || null,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.PLAYER_CREATED,
    metadata: { playerId: player.id, name: player.name },
  });

  return player;
}

export async function updatePlayer(input: UpdatePlayerInput) {
  const updated = await prisma.player.updateMany({
    where: { id: input.playerId, communityId: input.communityId },
    data: { status: input.status, notes: input.notes },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "player",
      resourceId: input.playerId,
      operation: "write",
    });
    throw new Error("Player not found.");
  }

  const player = await prisma.player.findFirst({
    where: { id: input.playerId, communityId: input.communityId },
  });

  if (!player) {
    throw new Error("Player not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.PLAYER_UPDATED,
    metadata: { playerId: input.playerId, status: input.status },
  });

  return player;
}

export async function listPlayers(input: {
  communityId: string;
  status?: PlayerStatus | null;
  q?: string | null;
  take?: number;
  cursor?: string | null;
}) {
  const where: Record<string, unknown> = {};
  where.communityId = input.communityId;
  if (input?.status) where.status = input.status;
  if (input?.q) {
    where.name = { contains: input.q, mode: "insensitive" };
  }

  const take = clampTake(input.take, { defaultTake: 80, maxTake: 200 });

  const cursor = input.cursor?.trim() ? input.cursor.trim() : null;

  const args = {
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    include: {
      actions: {
        select: { id: true, type: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  } satisfies Prisma.PlayerFindManyArgs;

  const rows = await prisma.player.findMany(args);

  return toCursorPage(rows, take);
}

export async function getPlayerById(input: { communityId: string; id: string }) {
  return prisma.player.findFirst({
    where: { id: input.id, communityId: input.communityId },
    include: {
      actions: {
        include: {
          moderatorUser: { select: { id: true, name: true, role: true } },
          caseActions: {
            include: {
              case: {
                select: { id: true, title: true, status: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      reports: {
        orderBy: { createdAt: "desc" },
      },
      casePlayers: {
        include: {
          case: {
            select: { id: true, title: true, status: true, createdAt: true },
          },
        },
      },
    },
  });
}

export async function getFlaggedPlayers(input: { communityId: string; limit?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 50);
  return prisma.player.findMany({
    where: { communityId: input.communityId, status: "WATCHED" },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
