import Link from "next/link";

import { CaseCommentForm } from "@/components/forms/case-comment-form";
import { CaseStatusForm } from "@/components/forms/case-status-form";
import { CasesToolbar } from "@/components/cases/cases-toolbar";
import { ConsoleLayout } from "@/components/layout/utility/console-layout";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  actionTypeVariant,
  caseStatusVariant,
  formatActionType,
  formatRole,
  playerStatusVariant,
} from "@/lib/presenters";
import { prisma } from "@/lib/db";
import { getCaseById, listCases } from "@/lib/services/case";
import { requirePermission } from "@/lib/services/auth";
import { listPlayers } from "@/lib/services/player";
import { listReports } from "@/lib/services/report";
import { listSavedViews } from "@/lib/services/views";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { CaseStatus, SavedViewScope } from "@prisma/client";

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string; status?: string; assigned?: string; cursor?: string }>;
}) {
  const user = await requirePermission(Permission.CASES_READ);
  const { caseId, status, assigned, cursor } = await searchParams;
  const statusFilter: CaseStatus | null =
    status === "OPEN" || status === "IN_REVIEW" || status === "RESOLVED" || status === "CLOSED"
      ? (status as CaseStatus)
      : null;
  const assignedFilter = assigned === "mine" || assigned === "unassigned" ? assigned : "all";

  const [casesPage, users, playersPage, reportsPage] = await Promise.all([
    listCases({
      communityId: user.communityId,
      status: statusFilter,
      assignedToUserId:
        assignedFilter === "unassigned" ? null : assignedFilter === "mine" ? user.id : undefined,
      take: 80,
      cursor: cursor ?? null,
    }),
    prisma.communityMembership.findMany({
      where: {
        communityId: user.communityId,
        role: { priority: { gte: ROLE_PRIORITY.TRIAL_MOD } },
        user: { disabledAt: null },
      },
      select: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    listPlayers({ communityId: user.communityId, take: 200 }),
    listReports({ communityId: user.communityId, take: 200 }),
  ]);
  const cases = casesPage.items;
  const nextCursor = casesPage.nextCursor;
  const players = playersPage.items;
  const reports = reportsPage.items;

  const views = await listSavedViews({
    communityId: user.communityId,
    userId: user.id,
    scope: SavedViewScope.CASES,
  });

  const selectedId = typeof caseId === "string" && caseId.trim() ? caseId.trim() : null;
  const selectedCase = selectedId
    ? await getCaseById({ communityId: user.communityId, id: selectedId })
    : null;

  const baseParams = new URLSearchParams();
  if (statusFilter) baseParams.set("status", statusFilter);
  if (assignedFilter !== "all") baseParams.set("assigned", assignedFilter);
  if (typeof cursor === "string" && cursor.trim()) baseParams.set("cursor", cursor.trim());

  return (
    <ConsoleLayout
      storageKey="cases"
      title="Cases"
      toolbar={
        <CasesToolbar
          status={statusFilter ?? "all"}
          assigned={assignedFilter}
          views={views.map((v) => ({ id: v.id, name: v.name, filtersJson: v.filtersJson }))}
          currentFilters={{
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(assignedFilter !== "all" ? { assigned: assignedFilter } : {}),
          }}
          dialogProps={{
            users: users.map((m) => m.user),
            players: players.map((p) => ({ id: p.id, name: p.name })),
            reports: reports.map((r) => ({ id: r.id, summary: r.summary })),
          }}
        />
      }
      list={
        <div className="h-full min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((record) => {
                const active = record.id === selectedId;
                return (
                  <TableRow
                    key={record.id}
                    className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={(() => {
                          const params = new URLSearchParams(baseParams);
                          params.set("caseId", record.id);
                          return `/app/cases?${params.toString()}`;
                        })()}
                        className="ui-transition block rounded-md hover:underline"
                      >
                        {record.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={caseStatusVariant(record.status)}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {record.assignedToUser?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {record.casePlayers.length}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {record.reports.length}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {record.caseActions.length}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {record.comments.length}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {formatDateTime(record.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {nextCursor ? (
            <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2">
              <Link
                href={(() => {
                  const params = new URLSearchParams(baseParams);
                  params.delete("caseId");
                  params.set("cursor", nextCursor);
                  return `/app/cases?${params.toString()}`;
                })()}
                className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
              >
                Next
              </Link>
            </div>
          ) : null}
        </div>
      }
      inspector={
        selectedCase ? (
          <div className="space-y-3">
            <MacWindow
              title={selectedCase.title}
              subtitle="Case inspector"
              className="bg-[color:var(--surface-strong)]"
              contentClassName="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={caseStatusVariant(selectedCase.status)}>
                  {selectedCase.status}
                </Badge>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/cases/${selectedCase.id}`}
                    className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
                  >
                    Open full case
                  </Link>
                  <Link
                    href={`/app/cases/${selectedCase.id}/export`}
                    className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
                  >
                    Export
                  </Link>
                </div>
              </div>

              <dl className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Assigned</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedCase.assignedToUser
                      ? `${selectedCase.assignedToUser.name} (${formatRole(selectedCase.assignedToUser.role)})`
                      : "Unassigned"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Created</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {formatDateTime(selectedCase.createdAt)}
                  </dd>
                </div>
              </dl>
            </MacWindow>

            <MacWindow title="Status" subtitle="Update case status">
              <CaseStatusForm caseId={selectedCase.id} status={selectedCase.status} />
            </MacWindow>

            <MacWindow title="Description" subtitle="Summary and context">
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-[color:var(--text-main)]">
                {selectedCase.description}
              </p>
            </MacWindow>

            <MacWindow title="Players" subtitle="Involved profiles">
              {selectedCase.casePlayers.length === 0 ? (
                <p className="text-[13px] text-[color:var(--text-muted)]">No players linked.</p>
              ) : (
                <div className="space-y-1.5">
                  {selectedCase.casePlayers.map((cp) => (
                    <Link
                      key={cp.player.id}
                      href={`/app/players/${cp.player.id}`}
                      className="ui-transition flex items-center justify-between rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <span className="text-[13px] font-medium text-[color:var(--text-main)]">
                        {cp.player.name}
                      </span>
                      <Badge variant={playerStatusVariant(cp.player.status)}>
                        {cp.player.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </MacWindow>

            <MacWindow title="Reports" subtitle="Linked reports">
              {selectedCase.reports.length === 0 ? (
                <p className="text-[13px] text-[color:var(--text-muted)]">No reports linked.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCase.reports.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                          {r.status}
                        </span>
                        <span className="text-xs text-[color:var(--text-muted)]">
                          {formatRelativeTime(r.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[color:var(--text-main)]">{r.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </MacWindow>

            <MacWindow title="Actions" subtitle="Linked moderation actions">
              {selectedCase.caseActions.length === 0 ? (
                <p className="text-[13px] text-[color:var(--text-muted)]">No actions linked.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCase.caseActions.slice(0, 6).map((ca) => (
                    <div
                      key={ca.action.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={actionTypeVariant(ca.action.type)}>
                          {formatActionType(ca.action.type)}
                        </Badge>
                        <span className="text-xs text-[color:var(--text-muted)]">
                          {formatRelativeTime(ca.action.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[color:var(--text-main)]">
                        {ca.action.reason}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        {ca.action.player.name} • {ca.action.moderatorUser.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </MacWindow>

            <MacWindow title="Comments" subtitle="Internal discussion" contentClassName="space-y-3">
              <CaseCommentForm caseId={selectedCase.id} />
              <div className="space-y-2">
                {selectedCase.comments.length === 0 ? (
                  <p className="text-[13px] text-[color:var(--text-muted)]">No comments yet.</p>
                ) : (
                  selectedCase.comments.slice(-6).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                        {c.user.name}{" "}
                        <span className="text-xs font-normal text-[color:var(--text-muted)]">
                          • {formatRelativeTime(c.createdAt)}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] text-[color:var(--text-main)]">
                        {c.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </MacWindow>
          </div>
        ) : null
      }
      inspectorEmpty={
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">No selection</p>
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Select a case from the list to view assignment, status, and linked context.
          </p>
        </div>
      }
    />
  );
}
