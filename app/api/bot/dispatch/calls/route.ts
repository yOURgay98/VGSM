import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
import { Permission } from "@/lib/security/permissions";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { ApiKeyAuthError, requireApiKeyFromRequest } from "@/lib/services/api-key-auth";
import { requireDiscordBotGuildScope, requireDiscordLinkedActor } from "@/lib/services/discord-bot";

const limiter = new InMemoryRateLimiter(60, 60_000);

export async function POST(req: Request) {
  try {
    const apiKey = await requireApiKeyFromRequest(req, {
      requiredPermission: Permission.DISPATCH_READ,
    });
    const body = (await req.json().catch(() => null)) as any;

    const guildId = typeof body?.guildId === "string" ? body.guildId.trim() : "";
    const discordUserId = typeof body?.discordUserId === "string" ? body.discordUserId.trim() : "";

    if (!guildId || !discordUserId) {
      return NextResponse.json(
        { ok: false, error: "guildId and discordUserId required." },
        { status: 400 },
      );
    }

    const rate = limiter.check(`${apiKey.id}:${discordUserId}:dispatch:calls`);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    await requireDiscordBotGuildScope({ communityId: apiKey.communityId, guildId });
    const actor = await requireDiscordLinkedActor({
      communityId: apiKey.communityId,
      discordUserId,
      requiredPermission: Permission.DISPATCH_READ,
    });

    const calls = await prisma.dispatchCall.findMany({
      where: {
        communityId: apiKey.communityId,
        status: { in: ["OPEN", "ASSIGNED", "ENROUTE", "ON_SCENE"] },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        locationName: true,
        updatedAt: true,
      },
    });

    const openCount = await prisma.dispatchCall.count({
      where: {
        communityId: apiKey.communityId,
        status: { in: ["OPEN", "ASSIGNED", "ENROUTE", "ON_SCENE"] },
      },
    });

    await createAuditLog({
      communityId: apiKey.communityId,
      userId: actor.user.id,
      eventType: AuditEvent.DISCORD_BOT_COMMAND,
      metadata: {
        action: "dispatch.calls",
        source: "discord",
        guildId,
        apiKeyId: apiKey.id,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      openCount,
      calls: calls.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        priority: c.priority,
        locationName: c.locationName,
        updatedAt: c.updatedAt.toISOString(),
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
