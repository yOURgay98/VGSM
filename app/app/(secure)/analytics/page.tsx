import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { getAvgReportResolutionMinutes, getStaffActionCounts } from "@/lib/services/analytics";
import { formatRole, roleVariant } from "@/lib/presenters";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { Role } from "@prisma/client";

function formatMinutes(value: number) {
  if (value < 60) return `${Math.round(value)}m`;
  const hours = value / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

export default async function AnalyticsPage() {
  const user = await requirePermission(Permission.PLAYERS_READ);
  const [staffCounts, avgResolution] = await Promise.all([
    getStaffActionCounts({ communityId: user.communityId, days: 14 }),
    getAvgReportResolutionMinutes({ communityId: user.communityId, days: 14 }),
  ]);

  const max = Math.max(1, ...staffCounts.map((s) => s.count));

  return (
    <div className="space-y-3">
      <MacWindow title="Staff Activity" subtitle="Actions recorded in the last 14 days">
        <div className="space-y-2">
          {staffCounts.length === 0 ? (
            <p className="text-[13px] text-[color:var(--text-muted)]">No staff records found.</p>
          ) : (
            staffCounts.map((row) => (
              <div key={row.userId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                      {row.name}
                    </p>
                    <Badge
                      variant={
                        Object.values(Role).includes(row.roleName as Role)
                          ? roleVariant(row.roleName as Role)
                          : "default"
                      }
                    >
                      {Object.values(Role).includes(row.roleName as Role)
                        ? formatRole(row.roleName as Role)
                        : row.roleName}
                    </Badge>
                  </div>
                  <div className="mt-1 h-2.5 w-full rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--accent)]/70"
                      style={{ width: `${Math.round((row.count / max) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-10 text-right text-[13px] font-medium text-[color:var(--text-main)]">
                  {row.count}
                </div>
              </div>
            ))
          )}
        </div>
      </MacWindow>

      <MacWindow title="Resolution Time" subtitle="Average time to resolve reports (last 14 days)">
        {avgResolution.minutes === null ? (
          <p className="text-[13px] text-[color:var(--text-muted)]">
            No resolved reports in the selected window.
          </p>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                Avg time
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
                {formatMinutes(avgResolution.minutes)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Sample size: {avgResolution.sampleSize}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[13px] text-[color:var(--text-muted)]">
              Keep charts simple: this view is intentionally minimal to stay fast.
            </div>
          </div>
        )}
      </MacWindow>
    </div>
  );
}
