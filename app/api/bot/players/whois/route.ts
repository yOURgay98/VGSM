import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
import { Permission } from "@/lib/security/permissions";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { ApiKeyAuthError, requireApiKeyFromRequest } from "@/lib/services/api-key-auth";
import { requireDiscordBotGuildScope, requireDiscordLinkedActor } from "@/lib/services/discord-bot";

const limiter = new InMemoryRateLimiter(90, 60_000);

export async function POST(req: Request) {
  try {
    const apiKey = await requireApiKeyFromRequest(req, {
      requiredPermission: Permission.PLAYERS_READ,
    });
    const body = (await req.json().catch(() => null)) as any;

    const guildId = typeof body?.guildId === "string" ? body.guildId.trim() : "";
    const discordUserId = typeof body?.discordUserId === "string" ? body.discordUserId.trim() : "";
    const query = typeof body?.query === "string" ? body.query.trim().slice(0, 80) : "";

    if (!guildId || !discordUserId || query.length < 2) {
      return NextResponse.json(
        { ok: false, error: "guildId, discordUserId, query(>=2) required." },
        { status: 400 },
      );
    }

    const rate = limiter.check(`${apiKey.id}:${discordUserId}:players:whois`);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    await requireDiscordBotGuildScope({ communityId: apiKey.communityId, guildId });
    const actor = await requireDiscordLinkedActor({
      communityId: apiKey.communityId,
      discordUserId,
      requiredPermission: Permission.PLAYERS_READ,
    });

    const maybeRobloxId = /^[0-9]{3,20}$/.test(query) ? query : null;

    const players = await prisma.player.findMany({
      where: {
        communityId: apiKey.communityId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          ...(maybeRobloxId ? [{ robloxId: maybeRobloxId }] : []),
        ],
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        robloxId: true,
        discordId: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      communityId: apiKey.communityId,
      userId: actor.user.id,
      eventType: AuditEvent.DISCORD_BOT_COMMAND,
      metadata: {
        action: "players.whois",
        source: "discord",
        guildId,
        apiKeyId: apiKey.id,
        query,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        robloxId: p.robloxId,
        discordId: p.discordId,
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof ApiKeyAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 400 },
    );
  }
}
