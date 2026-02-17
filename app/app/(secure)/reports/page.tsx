import { ReportStatusForm } from "@/components/forms/report-status-form";
import { ReportInspectorActions } from "@/components/reports/report-inspector-actions";
import { ReportsList } from "@/components/reports/reports-list";
import { ReportsToolbar } from "@/components/reports/reports-toolbar";
import { ConsoleLayout } from "@/components/layout/utility/console-layout";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { reportStatusVariant } from "@/lib/presenters";
import { listPlayers } from "@/lib/services/player";
import { getReportById, listReports } from "@/lib/services/report";
import { requirePermission } from "@/lib/services/auth";
import { listSavedViews } from "@/lib/services/views";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { ReportStatus, SavedViewScope } from "@prisma/client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string; status?: string; assigned?: string; cursor?: string }>;
}) {
  const user = await requirePermission(Permission.REPORTS_READ);
  const { reportId, status, assigned, cursor } = await searchParams;

  const statusFilter: ReportStatus | null =
    status === "OPEN" || status === "IN_REVIEW" || status === "RESOLVED" || status === "REJECTED"
      ? (status as ReportStatus)
      : null;
  const assignedFilter = assigned === "mine" || assigned === "unassigned" ? assigned : "all";

  const [reportsPage, playersPage, views] = await Promise.all([
    listReports({
      communityId: user.communityId,
      status: statusFilter,
      assignedToUserId:
        assignedFilter === "unassigned"
          ? null
          : assignedFilter === "mine" && user
            ? user.id
            : undefined,
      take: 80,
      cursor: cursor ?? null,
    }),
    listPlayers({ communityId: user.communityId, take: 200 }),
    listSavedViews({
      communityId: user.communityId,
      userId: user.id,
      scope: SavedViewScope.REPORTS,
    }),
  ]);
  const reports = reportsPage.items;
  const nextCursor = reportsPage.nextCursor;
  const players = playersPage.items;

  const selectedId = typeof reportId === "string" && reportId.trim() ? reportId.trim() : null;
  const selectedReport = selectedId
    ? await getReportById({ communityId: user.communityId, id: selectedId })
    : null;

  return (
    <ConsoleLayout
      storageKey="reports"
      title="Reports"
      toolbar={
        <ReportsToolbar
          status={statusFilter ?? "all"}
          assigned={assignedFilter}
          views={views.map((v) => ({ id: v.id, name: v.name, filtersJson: v.filtersJson }))}
          currentFilters={{
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(assignedFilter !== "all" ? { assigned: assignedFilter } : {}),
          }}
          players={players.map((p) => ({ id: p.id, name: p.name }))}
        />
      }
      list={
        <ReportsList
          reports={reports.map((r) => ({
            id: r.id,
            reporterName: r.reporterName ?? null,
            reporterContact: r.reporterContact ?? null,
            summary: r.summary,
            status: r.status,
            createdAt: r.createdAt,
            accusedPlayer: r.accusedPlayer,
            assignedToUser: r.assignedToUser,
          }))}
          selectedId={selectedId}
          nextCursor={nextCursor}
        />
      }
      inspector={
        selectedReport ? (
          <div className="space-y-3">
            <MacWindow
              title="Report"
              subtitle="Triage and outcome"
              className="bg-[color:var(--surface-strong)]"
              contentClassName="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={reportStatusVariant(selectedReport.status)}>
                  {selectedReport.status}
                </Badge>
                <span className="text-xs text-[color:var(--text-muted)]">
                  {formatRelativeTime(selectedReport.createdAt)}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[13px] font-medium text-[color:var(--text-main)]">Summary</p>
                <p className="whitespace-pre-wrap text-[13px] leading-6 text-[color:var(--text-main)]">
                  {selectedReport.summary}
                </p>
              </div>

              <dl className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Reporter</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedReport.reporterName ?? "Anonymous"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Contact</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedReport.reporterContact ?? "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Accused</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedReport.accusedPlayer?.name ?? "Unknown"}
                  </dd>
                </div>
              </dl>
            </MacWindow>

            <MacWindow title="Actions" subtitle="Triage operations" contentClassName="space-y-3">
              <ReportInspectorActions reportId={selectedReport.id} />
              <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
                <ReportStatusForm reportId={selectedReport.id} status={selectedReport.status} />
              </div>
              <p className="text-xs text-[color:var(--text-muted)]">
                Tip: Use Cmd/Ctrl+K for audited commands like opening a case from this report.
              </p>
            </MacWindow>
          </div>
        ) : null
      }
      inspectorEmpty={
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">No selection</p>
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Select a report from the list to triage it in the inspector.
          </p>
        </div>
      }
    />
  );
}
