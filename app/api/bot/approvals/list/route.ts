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
      requiredPermission: Permission.APPROVALS_DECIDE,
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

    const rate = limiter.check(`${apiKey.id}:${discordUserId}:approvals:list`);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    await requireDiscordBotGuildScope({ communityId: apiKey.communityId, guildId });
    const actor = await requireDiscordLinkedActor({
      communityId: apiKey.communityId,
      discordUserId,
      requiredPermission: Permission.APPROVALS_DECIDE,
    });

    const approvals = await prisma.approvalRequest.findMany({
      where: { communityId: apiKey.communityId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        requestedByUser: { select: { id: true, name: true, email: true } },
        payloadJson: true,
      },
    });

    await createAuditLog({
      communityId: apiKey.communityId,
      userId: actor.user.id,
      eventType: AuditEvent.DISCORD_BOT_COMMAND,
      metadata: {
        action: "approvals.list",
        source: "discord",
        guildId,
        apiKeyId: apiKey.id,
      } as any,
    });

    return NextResponse.json({
      ok: true,
      approvals: approvals.map((a) => ({
        id: a.id,
        riskLevel: a.riskLevel,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        requestedBy: a.requestedByUser
          ? { id: a.requestedByUser.id, name: a.requestedByUser.name }
          : null,
        payloadJson: a.payloadJson,
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
