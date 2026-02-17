import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { encryptString } from "@/lib/security/encryption";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export async function getDiscordAccountForUser(userId: string) {
  return prisma.discordAccount.findUnique({
    where: { userId },
  });
}

export async function upsertDiscordAccount(input: {
  userId: string;
  discordUserId: string;
  username?: string | null;
  discriminator?: string | null;
  avatar?: string | null;
}) {
  return prisma.discordAccount.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      discordUserId: input.discordUserId,
      username: input.username ?? null,
      discriminator: input.discriminator ?? null,
      avatar: input.avatar ?? null,
    },
    update: {
      discordUserId: input.discordUserId,
      username: input.username ?? null,
      discriminator: input.discriminator ?? null,
      avatar: input.avatar ?? null,
    },
  });
}

export async function unlinkDiscordAccount(input: {
  communityId: string | null;
  actorUserId: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.discordAccount.deleteMany({
      where: { userId: input.userId },
    });

    await tx.account.deleteMany({
      where: { userId: input.userId, provider: "discord" },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: AuditEvent.DISCORD_UNLINKED,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: { userId: input.userId } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );
  });
}

export async function getDiscordCommunityConfig(communityId: string) {
  return prisma.discordCommunityConfig.findUnique({
    where: { communityId },
  });
}

export async function upsertDiscordCommunityConfig(input: {
  communityId: string;
  actorUserId: string;
  guildId: string;
  botToken?: string | null;
  approvalsChannelId?: string | null;
  dispatchChannelId?: string | null;
  securityChannelId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const guildId = input.guildId.trim();
  if (!guildId) {
    throw new Error("Guild ID is required.");
  }

  const botTokenEnc = input.botToken?.trim() ? encryptString(input.botToken.trim()) : null;

  const record = await prisma.discordCommunityConfig.upsert({
    where: { communityId: input.communityId },
    create: {
      communityId: input.communityId,
      guildId,
      botTokenEnc,
      approvalsChannelId: input.approvalsChannelId?.trim() || null,
      dispatchChannelId: input.dispatchChannelId?.trim() || null,
      securityChannelId: input.securityChannelId?.trim() || null,
    },
    update: {
      guildId,
      ...(botTokenEnc ? { botTokenEnc } : {}),
      approvalsChannelId: input.approvalsChannelId?.trim() || null,
      dispatchChannelId: input.dispatchChannelId?.trim() || null,
      securityChannelId: input.securityChannelId?.trim() || null,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.DISCORD_CONFIG_UPDATED,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      guildId,
      approvalsChannelId: record.approvalsChannelId,
      dispatchChannelId: record.dispatchChannelId,
      securityChannelId: record.securityChannelId,
      botTokenUpdated: Boolean(botTokenEnc),
    } as unknown as Prisma.InputJsonValue,
  });

  return record;
}
