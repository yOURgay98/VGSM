import Link from "next/link";
import { notFound } from "next/navigation";

import { MacWindow } from "@/components/layout/mac-window";
import { PrintButton } from "@/components/utility/print-button";
import { Badge } from "@/components/ui/badge";
import { caseStatusVariant, formatRole } from "@/lib/presenters";
import { getCaseById } from "@/lib/services/case";
import { requirePermission } from "@/lib/services/auth";
import { logTenantViolationIfExists } from "@/lib/services/tenant";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function CaseExportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(Permission.CASES_READ);
  const { id } = await params;
  const record = await getCaseById({ communityId: user.communityId, id });
  if (!record) {
    await logTenantViolationIfExists({
      actorUserId: user.id,
      actorCommunityId: user.communityId,
      resource: "case",
      resourceId: id,
      operation: "export",
    });
    return notFound();
  }

  return (
    <div className="space-y-2">
      <MacWindow
        title="Case Packet Export"
        subtitle="Printable HTML export for sharing or filing"
        contentClassName="space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={caseStatusVariant(record.status)}>{record.status}</Badge>
            <span className="text-[13px] text-[color:var(--text-muted)]">
              Created {formatDateTime(record.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/app/cases/${record.id}`}
              className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
            >
              Back to case
            </Link>
            <PrintButton className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]" />
          </div>
        </div>

        <article className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-white p-4 text-black shadow-[var(--panel-shadow)] print:shadow-none">
          <header className="border-b border-black/10 pb-3">
            <h1 className="text-xl font-semibold tracking-tight">{record.title}</h1>
            <p className="mt-1 text-sm text-black/70">Case ID: {record.id}</p>
          </header>

          <section className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                Assignment
              </p>
              <p className="mt-1 text-sm">
                {record.assignedToUser
                  ? `${record.assignedToUser.name} (${formatRole(record.assignedToUser.role)})`
                  : "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
                Status
              </p>
              <p className="mt-1 text-sm">{record.status}</p>
            </div>
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{record.description}</p>
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
              Involved Players
            </p>
            {record.casePlayers.length === 0 ? (
              <p className="mt-2 text-sm text-black/70">None linked.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {record.casePlayers.map((cp) => (
                  <li key={cp.player.id}>
                    {cp.player.name} ({cp.player.status})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
              Linked Reports
            </p>
            {record.reports.length === 0 ? (
              <p className="mt-2 text-sm text-black/70">None linked.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {record.reports.map((r) => (
                  <li key={r.id} className="rounded-md border border-black/10 p-2">
                    <p className="font-medium">{r.status}</p>
                    <p className="mt-1 text-black/75">{r.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
              Linked Actions
            </p>
            {record.caseActions.length === 0 ? (
              <p className="mt-2 text-sm text-black/70">None linked.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {record.caseActions.map((ca) => (
                  <li key={ca.action.id} className="rounded-md border border-black/10 p-2">
                    <p className="font-medium">
                      {ca.action.type} • {ca.action.player?.name ?? "Unknown player"}
                    </p>
                    <p className="mt-1 text-black/75">{ca.action.reason}</p>
                    <p className="mt-1 text-xs text-black/60">
                      Moderator: {ca.action.moderatorUser?.name ?? "Unknown"} •{" "}
                      {formatDateTime(ca.action.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/60">
              Comments
            </p>
            {record.comments.length === 0 ? (
              <p className="mt-2 text-sm text-black/70">No comments.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {record.comments.map((c) => (
                  <li key={c.id} className="rounded-md border border-black/10 p-2">
                    <p className="font-medium">
                      {c.user.name} ({formatRole(c.user.role)}) • {formatDateTime(c.createdAt)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-black/75">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
      </MacWindow>
    </div>
  );
}
