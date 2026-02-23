"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { Permission } from "@/lib/security/permissions";
import { maskIpAddress, sanitizeUserAgent } from "@/lib/security/privacy";
import { requirePermission } from "@/lib/services/auth";
import { createApiKey, revokeApiKey, rotateApiKey } from "@/lib/services/api-keys";

function getRequestMeta(h: Headers) {
  const ip = maskIpAddress(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip"));
  const userAgent = sanitizeUserAgent(h.get("user-agent"));
  return { ip, userAgent };
}

function revalidateApiKeyViews() {
  revalidatePath("/app/settings/integrations");
  revalidatePath("/app/settings/integrations/discord");
  revalidatePath("/app/developer/api-keys");
  revalidatePath("/app/developer/sandbox");
}

export async function createDiscordBotApiKeyAction(
  _prev: { ok: boolean; message: string; key?: string },
  formData: FormData,
) {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const name = String(formData.get("name") ?? "").trim() || "Discord Bot";

  try {
    const created = await createApiKey({
      communityId: actor.communityId,
      actorUserId: actor.id,
      name,
      permissions: [Permission.PLAYERS_READ, Permission.DISPATCH_READ, Permission.APPROVALS_DECIDE],
      ip,
      userAgent,
    });

    revalidateApiKeyViews();
    return { ok: true, message: "API key created.", key: created.key };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create API key.",
    };
  }
}

export async function revokeApiKeyAction(apiKeyId: string) {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  await revokeApiKey({
    communityId: actor.communityId,
    actorUserId: actor.id,
    apiKeyId,
    ip,
    userAgent,
  });

  revalidateApiKeyViews();
  return { ok: true } as const;
}

export async function rotateApiKeyAction(apiKeyId: string) {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const created = await rotateApiKey({
    communityId: actor.communityId,
    actorUserId: actor.id,
    apiKeyId,
    ip,
    userAgent,
  });

  revalidateApiKeyViews();
  return { ok: true as const, key: created.key };
}

export async function createGeneralApiKeyAction(
  _prev: { ok: boolean; message: string; key?: string },
  formData: FormData,
) {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const name = String(formData.get("name") ?? "").trim();
  const profile = String(formData.get("profile") ?? "custom");

  const byProfile: Record<string, string[]> = {
    erlc_ingest: ["integrations:erlc:ingest"],
    discord_bot: [Permission.PLAYERS_READ, Permission.DISPATCH_READ, Permission.APPROVALS_DECIDE],
    read_only: [Permission.PLAYERS_READ, Permission.REPORTS_READ, Permission.CASES_READ],
    custom: [Permission.PLAYERS_READ],
  };

  const permissions = byProfile[profile] ?? byProfile.custom;

  try {
    const created = await createApiKey({
      communityId: actor.communityId,
      actorUserId: actor.id,
      name: name || "Service Key",
      permissions,
      ip,
      userAgent,
    });

    revalidateApiKeyViews();
    return { ok: true, message: "API key created.", key: created.key };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create API key.",
    };
  }
}
