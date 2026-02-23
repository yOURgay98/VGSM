import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { listApiKeys } from "@/lib/services/api-keys";
import { MacWindow } from "@/components/layout/mac-window";
import { Button } from "@/components/ui/button";
import { DiscordLinkButton } from "@/components/integrations/discord/discord-link-button";
import { DiscordCommunityConfigForm } from "@/components/integrations/discord/discord-community-config-form";
import { DiscordBotApiKeysPanel } from "@/components/integrations/discord/discord-bot-api-keys-panel";
import { unlinkDiscordAction } from "@/app/actions/discord-actions";

export default async function DiscordIntegrationPage() {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);

  const canEditConfig = actor.permissions.includes(Permission.SETTINGS_EDIT);
  const canManageKeys = actor.permissions.includes(Permission.API_KEYS_MANAGE);

  const [discordAccount, discordConfig, apiKeys] = await Promise.all([
    prisma.discordAccount.findUnique({
      where: { userId: actor.id },
      select: {
        discordUserId: true,
        username: true,
        discriminator: true,
        avatar: true,
        updatedAt: true,
      },
    }),
    prisma.discordCommunityConfig.findUnique({
      where: { communityId: actor.communityId },
      select: {
        guildId: true,
        approvalsChannelId: true,
        dispatchChannelId: true,
        securityChannelId: true,
        botTokenEnc: true,
      },
    }),
    canManageKeys ? listApiKeys({ communityId: actor.communityId }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-3">
      <MacWindow
        title="Discord Account"
        subtitle="Link your Discord identity for bot command authorization"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-[color:var(--text-main)]">
              Linked Discord accounts are used to map Discord slash-command users to VSM staff
              permissions.
            </p>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              We do not allow Discord OAuth to bypass password or 2FA by default.
            </p>
          </div>

          {discordAccount ? (
            <form action={unlinkDiscordAction} className="flex items-center gap-2">
              <Button type="submit" variant="outline" size="sm">
                Unlink
              </Button>
            </form>
          ) : (
            <DiscordLinkButton />
          )}
        </div>

        <div className="mt-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
          {discordAccount ? (
            <dl className="grid gap-2 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--text-muted)]">Discord User ID</dt>
                <dd className="font-mono text-[12px] text-[color:var(--text-main)]">
                  {discordAccount.discordUserId}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--text-muted)]">Username</dt>
                <dd className="text-[color:var(--text-main)]">
                  {discordAccount.username
                    ? `${discordAccount.username}${discordAccount.discriminator ? `#${discordAccount.discriminator}` : ""}`
                    : "-"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-[13px] text-[color:var(--text-muted)]">No Discord account linked.</p>
          )}
        </div>
      </MacWindow>

      {canEditConfig ? (
        <MacWindow title="Bot Configuration" subtitle="Guild scoping + channels (community-level)">
          <DiscordCommunityConfigForm
            encryptionKeyConfigured={Boolean(process.env.AUTH_ENCRYPTION_KEY)}
            initialValues={{
              guildId: discordConfig?.guildId ?? "",
              approvalsChannelId: discordConfig?.approvalsChannelId ?? null,
              dispatchChannelId: discordConfig?.dispatchChannelId ?? null,
              securityChannelId: discordConfig?.securityChannelId ?? null,
              botTokenConfigured: Boolean(discordConfig?.botTokenEnc),
            }}
          />
        </MacWindow>
      ) : null}

      {canManageKeys ? (
        <MacWindow
          title="Bot API Keys"
          subtitle="Keys authenticate the Discord bot service to the VSM API"
        >
          <DiscordBotApiKeysPanel keys={apiKeys} />
        </MacWindow>
      ) : null}
    </div>
  );
}
