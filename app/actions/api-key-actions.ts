"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { createApiKey, revokeApiKey } from "@/lib/services/api-keys";

function getRequestMeta(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
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

    revalidatePath("/app/settings/integrations/discord");
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

  revalidatePath("/app/settings/integrations/discord");
  return { ok: true } as const;
}
