import Link from "next/link";

import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { listAuditLogs } from "@/lib/services/audit-viewer";
import { requirePermission } from "@/lib/services/auth";
import { formatDateTime } from "@/lib/utils";

function formatUptime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default async function StatusPage() {
  const actor = await requirePermission(Permission.SECURITY_READ);
  const now = new Date();

  const [dbReady, activeSessions, pendingApprovals, integrity] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    prisma.session.count({
      where: {
        expires: { gt: now },
        activeCommunityId: actor.communityId,
      },
    }),
    prisma.approvalRequest.count({
      where: {
        communityId: actor.communityId,
        status: "PENDING",
      },
    }),
    listAuditLogs({
      communityId: actor.communityId,
      take: 120,
    }).then((result) => result.integrity),
  ]);

  const buildStamp =
    process.env.NEXT_PUBLIC_BUILD_STAMP ||
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
    process.env.GITHUB_SHA?.slice(0, 8) ||
    "dev";

  return (
    <div className="space-y-3">
      <MacWindow title="System Status" subtitle="Operational health and readiness">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Health" value="OK" hint={formatDateTime(now)} ok />
          <Metric
            label="DB Ready"
            value={dbReady ? "Ready" : "Unavailable"}
            hint="Readiness probe"
            ok={dbReady}
          />
          <Metric
            label="Audit Chain"
            value={integrity.ok ? "OK" : "Broken"}
            hint={integrity.partial ? "Partial window" : "Verified"}
            ok={integrity.ok}
          />
          <Metric
            label="Node Uptime"
            value={formatUptime(process.uptime())}
            hint={`build ${buildStamp}`}
            ok
          />
        </div>
      </MacWindow>

      <MacWindow title="Operational Snapshot" subtitle="Current scoped runtime values">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Snapshot label="Community" value={actor.community.name} />
          <Snapshot label="Active Sessions" value={String(activeSessions)} />
          <Snapshot label="Pending Approvals" value={String(pendingApprovals)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/api/health"
            className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Open /api/health
          </Link>
          <Link
            href="/api/ready"
            className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Open /api/ready
          </Link>
          {integrity.ok ? null : (
            <Badge variant="danger">
              first broken index {integrity.firstBrokenChainIndex ?? "unknown"}
            </Badge>
          )}
        </div>
      </MacWindow>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  ok,
}: {
  label: string;
  value: string;
  hint: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 shadow-[var(--panel-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-xl font-semibold tracking-tight text-[color:var(--text-main)]">
          {value}
        </p>
        <Badge variant={ok ? "default" : "danger"}>{hint}</Badge>
      </div>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium text-[color:var(--text-main)]">{value}</p>
    </div>
  );
}
