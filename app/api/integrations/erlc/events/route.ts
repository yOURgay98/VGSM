import { NextResponse } from "next/server";
import { z } from "zod";

import { InMemoryRateLimiter } from "@/lib/rate-limit";
import { ApiKeyAuthError, requireApiKeyFromRequest } from "@/lib/services/api-key-auth";
import { ERLC_INGEST_PERMISSION, ingestErlcEvent, getErlcIntegrationState } from "@/lib/services/erlc-integration";

const payloadSchema = z.object({
  eventType: z.string().trim().min(2).max(80),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const limiter = new InMemoryRateLimiter(60, 60_000);

export async function POST(request: Request) {
  try {
    const key = await requireApiKeyFromRequest(request, {
      requiredPermission: ERLC_INGEST_PERMISSION,
    });

    const limit = limiter.check(`erlc:${key.id}`);
    if (!limit.allowed) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const json = await request.json().catch(() => ({}));
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const state = await getErlcIntegrationState(key.communityId);
    if (!state.enabled) {
      return NextResponse.json({ ok: false, error: "integration_disabled" }, { status: 403 });
    }

    await ingestErlcEvent({
      communityId: key.communityId,
      eventType: parsed.data.eventType,
      payload: parsed.data.payload,
      source: "api",
      apiKeyId: key.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiKeyAuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}

