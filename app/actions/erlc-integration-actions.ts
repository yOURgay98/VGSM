"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { Permission } from "@/lib/security/permissions";
import { maskIpAddress, sanitizeUserAgent } from "@/lib/security/privacy";
import { requirePermission } from "@/lib/services/auth";
import {
  createErlcIntegrationToken,
  ingestErlcEvent,
  updateErlcIntegrationState,
} from "@/lib/services/erlc-integration";

function getRequestMeta(h: Headers) {
  const ip = maskIpAddress(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"));
  const userAgent = sanitizeUserAgent(h.get("user-agent"));
  return { ip, userAgent };
}

function revalidateIntegrationViews() {
  revalidatePath("/app/settings/integrations");
  revalidatePath("/app/developer/sandbox");
}

export async function setErlcEnabledAction(enabled: boolean) {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);
  await updateErlcIntegrationState({
    communityId: actor.communityId,
    actorUserId: actor.id,
    patch: { enabled: Boolean(enabled) },
  });
  revalidateIntegrationViews();
  return { ok: true as const };
}

export async function createErlcTokenAction() {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const created = await createErlcIntegrationToken({
    communityId: actor.communityId,
    actorUserId: actor.id,
    ip,
    userAgent,
  });

  revalidateIntegrationViews();
  return { ok: true as const, key: created.key };
}

export async function sendErlcTestEventAction(_prev: { ok: boolean; message: string }, formData: FormData) {
  try {
    const actor = await requirePermission(Permission.API_KEYS_MANAGE);
    const eventType = String(formData.get("eventType") ?? "").trim() || "moderation.action";
    const payloadRaw = String(formData.get("payload") ?? "{}").trim();

    const payload = JSON.parse(payloadRaw || "{}") as Record<string, unknown>;
    await ingestErlcEvent({
      communityId: actor.communityId,
      actorUserId: actor.id,
      eventType,
      payload,
      source: "sandbox",
    });

    revalidateIntegrationViews();
    revalidatePath("/app/audit");
    return { ok: true, message: "Test event ingested and written to audit." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to ingest test event.",
    };
  }
}

