import { prisma } from "@/lib/db";
import { authorize } from "@/lib/security/authorize";
import type { Permission } from "@/lib/security/permissions";
import { getCommunityAuthContext } from "@/lib/services/community";

export async function requireDiscordBotGuildScope(input: { communityId: string; guildId: string }) {
  const config = await prisma.discordCommunityConfig.findUnique({
    where: { communityId: input.communityId },
    select: { guildId: true },
  });

  if (!config) {
    throw new Error("Discord integration is not configured for this community.");
  }

  if (config.guildId !== input.guildId) {
    throw new Error("Guild is not authorized for this community.");
  }

  return config;
}

export async function requireDiscordLinkedActor(input: {
  communityId: string;
  discordUserId: string;
  requiredPermission: Permission;
}) {
  const discord = await prisma.discordAccount.findUnique({
    where: { discordUserId: input.discordUserId },
    select: { userId: true },
  });

  if (!discord) {
    throw new Error("Discord account not linked to a VSM user.");
  }

  const user = await prisma.user.findUnique({
    where: { id: discord.userId },
    select: { id: true, name: true, email: true, role: true, disabledAt: true },
  });

  if (!user || user.disabledAt) {
    throw new Error("User is not permitted.");
  }

  const ctx = await getCommunityAuthContext({ userId: user.id, communityId: input.communityId });

  authorize(
    { id: user.id, role: user.role, disabledAt: user.disabledAt, permissions: ctx.permissions },
    input.requiredPermission,
  );

  return {
    user,
    community: ctx.community,
    membership: ctx.membership,
    permissions: ctx.permissions,
  };
}
