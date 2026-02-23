import { MacWindow } from "@/components/layout/mac-window";
import { DisabledAction } from "@/components/shared/disabled-action";
import { PageShell } from "@/components/shared/page-shell";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PlatformNotificationsPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <PageShell
      title="Notifications"
      description="Configure delivery channels and alert severity routing for operational events."
      primaryAction={<DisabledAction label="Create Rule" className="min-w-[220px]" />}
    >
      <MacWindow title="Channels" subtitle="Current notification channels">
        <p className="text-[13px] text-[color:var(--text-muted)]">
          No channels configured yet. Notification routing is available as a partial stub in this build.
        </p>
      </MacWindow>
    </PageShell>
  );
}
