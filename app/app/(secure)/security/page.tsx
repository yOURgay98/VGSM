import Link from "next/link";

import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getSecurityDashboardMetrics } from "@/lib/services/security-dashboard";
import { listSecurityEvents } from "@/lib/services/security-events";
import { formatDateTime } from "@/lib/utils";

export default async function SecurityDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    severity?: string;
    eventType?: string;
    userId?: string;
    cursor?: string;
  }>;
}) {
  const user = await requirePermission(Permission.SECURITY_READ);
  const { severity, eventType, userId, cursor } = await searchParams;

  const metrics = await getSecurityDashboardMetrics({ communityId: user.communityId });
  const events = await listSecurityEvents({
    communityId: user.communityId,
    take: 60,
    cursor: typeof cursor === "string" ? cursor : null,
    severity:
      severity === "LOW" || severity === "MEDIUM" || severity === "HIGH" || severity === "CRITICAL"
        ? severity
        : null,
    eventType: typeof eventType === "string" ? eventType : null,
    userId: typeof userId === "string" ? userId : null,
  });

  return (
    <div className="space-y-3" data-tour="security-dashboard">
      <MacWindow title="Security Dashboard" subtitle="Operational security status for the panel">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="Active sessions"
            value={String(metrics.activeSessions)}
            hint="Last 5 minutes"
          />
          <Metric
            label="Failed logins"
            value={String(metrics.failedLoginAttempts)}
            hint="Last 24 hours"
          />
          <Metric
            label="2FA enrollment"
            value={`${metrics.staff.pct2fa}%`}
            hint={`${metrics.staff.with2fa}/${metrics.staff.total} staff`}
          />
          <Metric
            label="High-risk commands"
            value={String(metrics.highRiskCommands7d)}
            hint="Last 7 days"
          />
        </div>
      </MacWindow>

      <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
        <MacWindow title="Approvals" subtitle="Pending high-risk actions">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[13px] text-[color:var(--text-main)]">
                <span className="font-semibold">{metrics.approvalsPending}</span> pending approval
                request(s).
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                Approvals enforce the two-person rule for high-risk commands.
              </p>
            </div>
            <Link
              href="/app/inbox"
              className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              Open Inbox
            </Link>
          </div>
        </MacWindow>

        <MacWindow title="Locked Accounts" subtitle="Currently locked out">
          {metrics.lockedUsers.length === 0 ? (
            <p className="text-[13px] text-[color:var(--text-muted)]">No locked accounts.</p>
          ) : (
            <div className="space-y-2">
              {metrics.lockedUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                        {u.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[color:var(--text-main)]">
                        {u.role}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                        Locked until {u.lockedUntil ? formatDateTime(u.lockedUntil) : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MacWindow>
      </div>

      <MacWindow title="Failed Login Attempts" subtitle="Last 24 hours (most recent first)">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>User Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.recentFailedAttempts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No failed logins recorded.
                  </TableCell>
                </TableRow>
              ) : (
                metrics.recentFailedAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(attempt.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{attempt.email}</TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {attempt.ip ?? "-"}
                    </TableCell>
                    <TableCell
                      className="max-w-[380px] truncate text-[color:var(--text-muted)]"
                      title={attempt.userAgent ?? ""}
                    >
                      {attempt.userAgent ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </MacWindow>

      <MacWindow title="Suspicious Sessions" subtitle="New IP events (last 7 days)">
        {metrics.suspiciousNewIp.length === 0 ? (
          <p className="text-[13px] text-[color:var(--text-muted)]">No new IP events recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.suspiciousNewIp.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{e.user?.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="default">{e.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {(e.metadata as any)?.ip ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </MacWindow>

      <MacWindow title="Security Events" subtitle="Signal-oriented event feed">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <label className="grid gap-1 text-xs text-[color:var(--text-muted)]">
            Severity
            <select
              name="severity"
              defaultValue={typeof severity === "string" ? severity : ""}
              className="input-neutral ui-transition h-9 px-3 text-[13px]"
            >
              <option value="">All</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[color:var(--text-muted)]">
            Event Type
            <Input
              name="eventType"
              defaultValue={typeof eventType === "string" ? eventType : ""}
              className="h-9 w-[220px]"
              placeholder="e.g. login_new_ip"
            />
          </label>
          <label className="grid gap-1 text-xs text-[color:var(--text-muted)]">
            User ID (optional)
            <Input
              name="userId"
              defaultValue={typeof userId === "string" ? userId : ""}
              className="h-9 w-[220px]"
              placeholder="user id"
            />
          </label>
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
        </form>

        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No security events found.
                  </TableCell>
                </TableRow>
              ) : (
                events.items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{e.severity}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{e.eventType}</TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {e.user?.name ?? "-"}
                    </TableCell>
                    <TableCell
                      className="max-w-[420px] truncate text-[color:var(--text-muted)]"
                      title={JSON.stringify(e.metadata ?? {})}
                    >
                      {e.metadata ? JSON.stringify(e.metadata) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {events.nextCursor ? (
          <div className="mt-3 flex items-center justify-end">
            <Link
              href={(() => {
                const params = new URLSearchParams();
                if (typeof severity === "string" && severity) params.set("severity", severity);
                if (typeof eventType === "string" && eventType) params.set("eventType", eventType);
                if (typeof userId === "string" && userId) params.set("userId", userId);
                params.set("cursor", events.nextCursor);
                return `/app/security?${params.toString()}`;
              })()}
              className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              Next
            </Link>
          </div>
        ) : null}
      </MacWindow>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 shadow-[var(--panel-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          {value}
        </p>
        <Badge variant="default" className="h-6">
          {hint}
        </Badge>
      </div>
    </div>
  );
}
