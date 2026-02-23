import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { createApiKey } from "@/lib/services/api-keys";

export const ERLC_INGEST_PERMISSION = "integrations:erlc:ingest";
const ERLC_SETTINGS_KEY = "integrations.erlc";

export interface ErlcIntegrationState {
  enabled: boolean;
  lastEventReceivedAt: string | null;
  lastSyncAt: string | null;
  ingestApiKeyId: string | null;
}

const DEFAULT_STATE: ErlcIntegrationState = {
  enabled: false,
  lastEventReceivedAt: null,
  lastSyncAt: null,
  ingestApiKeyId: null,
};

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function normalizeState(raw: unknown): ErlcIntegrationState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_STATE;
  }
  const obj = raw as Record<string, unknown>;
  return {
    enabled: obj.enabled === true,
    lastEventReceivedAt:
      typeof obj.lastEventReceivedAt === "string" ? obj.lastEventReceivedAt : null,
    lastSyncAt: typeof obj.lastSyncAt === "string" ? obj.lastSyncAt : null,
    ingestApiKeyId: typeof obj.ingestApiKeyId === "string" ? obj.ingestApiKeyId : null,
  };
}

export async function getErlcIntegrationState(communityId: string): Promise<ErlcIntegrationState> {
  const row = await prisma.setting.findUnique({
    where: { communityId_key: { communityId, key: ERLC_SETTINGS_KEY } },
    select: { valueJson: true },
  });
  return normalizeState(row?.valueJson ?? null);
}

export async function updateErlcIntegrationState(input: {
  communityId: string;
  actorUserId: string;
  patch: Partial<ErlcIntegrationState>;
}) {
  const current = await getErlcIntegrationState(input.communityId);
  const next: ErlcIntegrationState = {
    ...current,
    ...input.patch,
  };

  await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key: ERLC_SETTINGS_KEY } },
    create: {
      communityId: input.communityId,
      key: ERLC_SETTINGS_KEY,
      valueJson: toInputJson(next),
    },
    update: {
      valueJson: toInputJson(next),
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.ERLC_STATUS_UPDATED,
    metadata: { enabled: next.enabled, hasIngestKey: Boolean(next.ingestApiKeyId) },
  });

  return next;
}

export async function createErlcIntegrationToken(input: {
  communityId: string;
  actorUserId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const created = await createApiKey({
    communityId: input.communityId,
    actorUserId: input.actorUserId,
    name: "ERLC Ingestion",
    permissions: [ERLC_INGEST_PERMISSION],
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });

  await updateErlcIntegrationState({
    communityId: input.communityId,
    actorUserId: input.actorUserId,
    patch: { ingestApiKeyId: created.id, enabled: true },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.ERLC_CONNECTED,
    metadata: { ingestApiKeyId: created.id },
  });

  return created;
}

export async function ingestErlcEvent(input: {
  communityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  source: "api" | "sandbox";
  actorUserId?: string | null;
  apiKeyId?: string | null;
}) {
  const state = await getErlcIntegrationState(input.communityId);

  const nowIso = new Date().toISOString();
  const nextState: ErlcIntegrationState = {
    ...state,
    enabled: true,
    lastEventReceivedAt: nowIso,
    lastSyncAt: nowIso,
  };

  await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key: ERLC_SETTINGS_KEY } },
    create: {
      communityId: input.communityId,
      key: ERLC_SETTINGS_KEY,
      valueJson: toInputJson(nextState),
    },
    update: { valueJson: toInputJson(nextState) },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId ?? null,
    eventType: AuditEvent.ERLC_EVENT_INGESTED,
    metadata: {
      source: input.source,
      apiKeyId: input.apiKeyId ?? null,
      eventType: input.eventType,
      payload: input.payload as Record<string, Prisma.InputJsonValue | null>,
    } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true as const, receivedAt: nowIso };
}
