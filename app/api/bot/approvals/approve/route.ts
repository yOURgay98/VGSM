import { NextResponse } from "next/server";

import { executeCommandFromApproval } from "@/lib/commands/run";
import { InMemoryRateLimiter } from "@/lib/rate-limit";
import { Permission } from "@/lib/security/permissions";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { ApiKeyAuthError, requireApiKeyFromRequest } from "@/lib/services/api-key-auth";
import { requireDiscordBotGuildScope, requireDiscordLinkedActor } from "@/lib/services/discord-bot";

const limiter = new InMemoryRateLimiter(30, 60_000);

function getRequestMeta(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function POST(req: Request) {
  try {
    const apiKey = await requireApiKeyFromRequest(req, {
      requiredPermission: Permission.APPROVALS_DECIDE,
    });
    const body = (await req.json().catch(() => null)) as any;

    const approvalId = typeof body?.approvalId === "string" ? body.approvalId.trim() : "";
    const guildId = typeof body?.guildId === "string" ? body.guildId.trim() : "";
    const discordUserId = typeof body?.discordUserId === "string" ? body.discordUserId.trim() : "";

    if (!approvalId || !guildId || !discordUserId) {
      return NextResponse.json(
        { ok: false, error: "approvalId, guildId, discordUserId required." },
        { status: 400 },
      );
    }

    const rate = limiter.check(`${apiKey.id}:${discordUserId}:approvals:approve`);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    await requireDiscordBotGuildScope({ communityId: apiKey.communityId, guildId });
    const actor = await requireDiscordLinkedActor({
      communityId: apiKey.communityId,
      discordUserId,
      requiredPermission: Permission.APPROVALS_DECIDE,
    });

    const { ip, userAgent } = getRequestMeta(req);
    const result = await executeCommandFromApproval({
      approvalId,
      approverUserId: actor.user.id,
      approverSessionToken: null,
      ip,
      userAgent,
    });

    await createAuditLog({
      communityId: apiKey.communityId,
      userId: actor.user.id,
      eventType: AuditEvent.DISCORD_BOT_COMMAND,
      ip,
      userAgent,
      metadata: {
        action: "approvals.approve",
        source: "discord",
        guildId,
        apiKeyId: apiKey.id,
        approvalId,
      } as any,
    });

    return NextResponse.json({ ok: true, result });
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
