import { MacWindow } from "@/components/layout/mac-window";
import { DisabledAction } from "@/components/shared/disabled-action";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
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
        <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Notification center status
            </p>
            <Badge variant="info">Early access</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--text-muted)]">
            In-app alert summaries are available in the header. Channel routing (Discord/email/webhooks)
            is staged for rollout.
          </p>
          <ul className="list-disc space-y-1 pl-4 text-[13px] text-[color:var(--text-muted)]">
            <li>Route security alerts by severity and module.</li>
            <li>Create role-targeted delivery policies.</li>
            <li>Track delivery failures and retry history.</li>
          </ul>
        </div>
      </MacWindow>

      <MacWindow title="Why it matters" subtitle="Faster triage, lower alert fatigue">
        <p className="text-[13px] text-[color:var(--text-muted)]">
          Structured notifications keep moderators focused on actionable incidents instead of
          constantly checking every module manually.
        </p>
      </MacWindow>
    </PageShell>
  );
}
