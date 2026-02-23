import Link from "next/link";

import { MacWindow } from "@/components/layout/mac-window";
import { DisabledAction } from "@/components/shared/disabled-action";
import { ErlcIntegrationCard } from "@/components/integrations/erlc/erlc-integration-card";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getErlcIntegrationState } from "@/lib/services/erlc-integration";
import { prisma } from "@/lib/db";

export default async function IntegrationsPage() {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);
  const canManageKeys = actor.permissions.includes(Permission.API_KEYS_MANAGE);

  const [erlcState, discordConfig] = await Promise.all([
    getErlcIntegrationState(actor.communityId),
    prisma.discordCommunityConfig.findUnique({
      where: { communityId: actor.communityId },
      select: { guildId: true, updatedAt: true, botTokenEnc: true },
    }),
  ]);

  return (
    <div className="space-y-3">
      <MacWindow
        title="Integrations"
        subtitle="Connect VSM to external systems using scoped keys and audited events"
      >
        <ErlcIntegrationCard
          enabled={erlcState.enabled}
          lastEventReceivedAt={erlcState.lastEventReceivedAt}
          lastSyncAt={erlcState.lastSyncAt}
          ingestApiKeyId={erlcState.ingestApiKeyId}
          canManageSettings
          canManageKeys={canManageKeys}
        />
      </MacWindow>

      <MacWindow title="Discord" subtitle="Role-linked Discord integration and bot command bridge">
        <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
          <p className="text-[13px] text-[color:var(--text-main)]">
            Status:{" "}
            <span className="font-medium">
              {discordConfig?.guildId ? `Connected (${discordConfig.guildId})` : "Not connected"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/settings/integrations/discord"
              className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              Open Discord settings
            </Link>
            <DisabledAction label="Enable webhook relay" />
          </div>
        </div>
      </MacWindow>
    </div>
  );
}

