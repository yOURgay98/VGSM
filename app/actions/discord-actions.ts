"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { ROLE_PRIORITY } from "@/lib/permissions";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getSensitiveModeStatus } from "@/lib/services/sensitive-mode";
import { getCurrentSessionToken } from "@/lib/services/session";
import { unlinkDiscordAccount, upsertDiscordCommunityConfig } from "@/lib/services/discord";

function getRequestMeta(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function unlinkDiscordAction(_formData: FormData) {
  const actor = await requirePermission(Permission.PLAYERS_READ);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  // Require sensitive mode for admins/owners to prevent accidental unlinking of critical accounts.
  if (actor.membership.role.priority >= ROLE_PRIORITY.ADMIN) {
    const token = await getCurrentSessionToken();
    if (!token) {
      throw new Error("Session missing; sign in again and retry.");
    }
    const status = await getSensitiveModeStatus({ userId: actor.id, sessionToken: token });
    if (!status.enabled) {
      throw new Error("Sensitive mode required to unlink Discord for admins/owners.");
    }
  }

  await unlinkDiscordAccount({
    communityId: actor.communityId,
    actorUserId: actor.id,
    userId: actor.id,
    ip,
    userAgent,
  });

  revalidatePath("/app/settings/integrations/discord");
}

export async function updateDiscordCommunityConfigAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
) {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const guildId = String(formData.get("guildId") ?? "");
  const approvalsChannelId = String(formData.get("approvalsChannelId") ?? "");
  const dispatchChannelId = String(formData.get("dispatchChannelId") ?? "");
  const securityChannelId = String(formData.get("securityChannelId") ?? "");
  const botToken = String(formData.get("botToken") ?? "");

  try {
    await upsertDiscordCommunityConfig({
      communityId: actor.communityId,
      actorUserId: actor.id,
      guildId,
      botToken: botToken.trim() ? botToken : null,
      approvalsChannelId: approvalsChannelId.trim() ? approvalsChannelId : null,
      dispatchChannelId: dispatchChannelId.trim() ? dispatchChannelId : null,
      securityChannelId: securityChannelId.trim() ? securityChannelId : null,
      ip,
      userAgent,
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update Discord config.",
    };
  }

  revalidatePath("/app/settings/integrations/discord");
  return { ok: true, message: "Discord configuration updated." };
}
