import Link from "next/link";

import { MacWindow } from "@/components/layout/mac-window";
import { LiveActivityFeed } from "@/components/live/activity-feed";
import { StaffPresencePanel } from "@/components/live/staff-presence-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/services/dashboard";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { formatActionType, actionTypeVariant, playerStatusVariant } from "@/lib/presenters";
import { formatRelativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requirePermission(Permission.PLAYERS_READ);
  const data = await getDashboardData({ communityId: user.communityId });
  const maxActivity = Math.max(...data.staffActivity.map((item) => item.count), 1);
  const showGettingStarted =
    data.openReports === 0 &&
    data.totalCasesOpen === 0 &&
    data.flaggedPlayers.length === 0 &&
    data.recentActions.length === 0;

  return (
    <div className="space-y-2">
      {showGettingStarted ? (
        <MacWindow
          title="Getting Started"
          subtitle="Recommended first-run setup for new communities"
        >
          <div className="grid gap-2 md:grid-cols-3">
            <StarterStep
              title="Invite trusted staff"
              body="Create access keys or invite links before granting role permissions."
              href="/app/settings/access-keys"
              cta="Open access keys"
            />
            <StarterStep
              title="Set up map operations"
              body="Open Dispatch map, add POIs/zones, and verify layer visibility."
              href="/app/dispatch?map=1"
              cta="Open dispatch map"
            />
            <StarterStep
              title="Lock down security"
              body="Review 2FA, sessions, approvals, and SOC alerts before scaling."
              href="/app/security"
              cta="Open security"
            />
          </div>
        </MacWindow>
      ) : null}

      <MacWindow title="Dashboard" subtitle="Operational overview for your moderation team">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open Reports" value={String(data.openReports)} href="/app/reports" />
          <MetricCard label="Open Cases" value={String(data.totalCasesOpen)} href="/app/cases" />
          <MetricCard
            label="Flagged Players"
            value={String(data.flaggedPlayers.length)}
            href="/app/players"
          />
          <MetricCard
            label="Recent Actions"
            value={String(data.recentActions.length)}
            href="/app/actions"
          />
        </div>
      </MacWindow>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <MacWindow title="Live Activity" subtitle="Near real-time system events">
          <LiveActivityFeed compact />
        </MacWindow>

        <MacWindow title="Staff Presence" subtitle="Staff currently online in the panel">
          <StaffPresencePanel max={8} />
        </MacWindow>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <MacWindow title="Recent Actions" subtitle="Latest moderation activity">
          <ul className="space-y-1.5">
            {data.recentActions.map((action) => (
              <li
                key={action.id}
                className="flex items-center justify-between rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {action.moderatorUser.name} {"->"} {action.player.name}
                  </p>
                  <p className="text-xs text-[color:var(--text-muted)]">{action.reason}</p>
                </div>
                <div className="text-right">
                  <Badge variant={actionTypeVariant(action.type)}>
                    {formatActionType(action.type)}
                  </Badge>
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    {formatRelativeTime(action.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </MacWindow>

        <MacWindow title="Staff Activity" subtitle="Actions recorded in the last 7 days">
          <div className="space-y-1.5">
            {data.staffActivity.length === 0 ? (
              <p className="text-sm text-[color:var(--text-muted)]">No activity this week.</p>
            ) : (
              data.staffActivity.map((item) => (
                <div key={item.userId}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span>{item.userName}</span>
                    <span className="text-[color:var(--text-muted)]">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 dark:bg-white/[0.08]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)] ui-transition"
                      style={{ width: `${Math.max((item.count / maxActivity) * 100, 8)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </MacWindow>
      </div>

      <MacWindow title="Flagged Players" subtitle="Players currently being watched">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.flaggedPlayers.length === 0 ? (
            <p className="text-sm text-[color:var(--text-muted)]">No flagged players.</p>
          ) : (
            data.flaggedPlayers.map((player) => (
              <Card key={player.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{player.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant={playerStatusVariant(player.status)}>{player.status}</Badge>
                    <Link
                      href={`/app/players/${player.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </MacWindow>
    </div>
  );
}

function StarterStep({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2">
      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">{body}</p>
      <Link
        href={href}
        className="ui-transition mt-2 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
      >
        {cta}
      </Link>
    </div>
  );
}

function MetricCard({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 shadow-[var(--panel-shadow)] hover:bg-white/80 dark:hover:bg-white/[0.08]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
        {value}
      </p>
    </Link>
  );
}
