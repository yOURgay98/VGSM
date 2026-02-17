import Link from "next/link";
import { notFound } from "next/navigation";

import { CaseCommentForm } from "@/components/forms/case-comment-form";
import { CaseStatusForm } from "@/components/forms/case-status-form";
import { LinkCaseActionForm } from "@/components/forms/link-case-action-form";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { caseStatusVariant, actionTypeVariant, formatActionType } from "@/lib/presenters";
import { getCaseById } from "@/lib/services/case";
import { listActions } from "@/lib/services/action";
import { requirePermission } from "@/lib/services/auth";
import { logTenantViolationIfExists } from "@/lib/services/tenant";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(Permission.CASES_READ);
  const { id } = await params;
  const [caseRecord, actionsPage] = await Promise.all([
    getCaseById({ communityId: user.communityId, id }),
    listActions({ communityId: user.communityId, take: 120 }),
  ]);
  const actions = actionsPage.items;

  if (!caseRecord) {
    await logTenantViolationIfExists({
      actorUserId: user.id,
      actorCommunityId: user.communityId,
      resource: "case",
      resourceId: id,
      operation: "read",
    });
    notFound();
  }

  const linkedActionIds = new Set(caseRecord.caseActions.map((link) => link.action.id));
  const availableActions = actions
    .filter((action) => !linkedActionIds.has(action.id))
    .map((action) => ({
      id: action.id,
      label: `${action.type} - ${action.player.name} (${formatDateTime(action.createdAt)})`,
    }))
    .slice(0, 60);

  return (
    <div className="space-y-3">
      <MacWindow title={caseRecord.title} subtitle="Case details and collaborative timeline">
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge variant={caseStatusVariant(caseRecord.status)}>{caseRecord.status}</Badge>
                <CaseStatusForm caseId={caseRecord.id} status={caseRecord.status} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--text-main)]">
                {caseRecord.description}
              </p>
              <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                Created {formatDateTime(caseRecord.createdAt)} | Assigned to{" "}
                {caseRecord.assignedToUser?.name ?? "Unassigned"}
              </p>
            </div>

            <MacWindow title="Timeline" className="p-0">
              <ul className="space-y-2">
                {caseRecord.caseActions.length === 0 ? (
                  <li className="text-sm text-[color:var(--text-muted)]">No actions linked yet.</li>
                ) : (
                  caseRecord.caseActions.map((caseAction) => (
                    <li
                      key={caseAction.action.id}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={actionTypeVariant(caseAction.action.type)}>
                          {formatActionType(caseAction.action.type)}
                        </Badge>
                        <span className="text-xs text-[color:var(--text-muted)]">
                          {formatRelativeTime(caseAction.action.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--text-main)]">
                        {caseAction.action.reason}
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        {caseAction.action.player.name} moderated by{" "}
                        {caseAction.action.moderatorUser.name}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </MacWindow>

            <MacWindow title="Comments" className="p-0">
              <div className="space-y-3">
                {caseRecord.comments.length === 0 ? (
                  <p className="text-sm text-[color:var(--text-muted)]">No comments yet.</p>
                ) : (
                  caseRecord.comments.map((comment) => (
                    <article
                      key={comment.id}
                      className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
                    >
                      <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                        <span>{comment.user.name}</span>
                        <span>{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--text-main)]">{comment.body}</p>
                    </article>
                  ))
                )}

                <CaseCommentForm caseId={caseRecord.id} />
              </div>
            </MacWindow>
          </div>

          <div className="space-y-3">
            <MacWindow title="Involved Players" className="p-0">
              <ul className="space-y-2 text-sm">
                {caseRecord.casePlayers.length === 0 ? (
                  <li className="text-[color:var(--text-muted)]">No players linked.</li>
                ) : (
                  caseRecord.casePlayers.map((casePlayer) => (
                    <li key={casePlayer.player.id}>
                      <Link
                        href={`/app/players/${casePlayer.player.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {casePlayer.player.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </MacWindow>

            <MacWindow title="Linked Reports" className="p-0">
              <ul className="space-y-2 text-sm">
                {caseRecord.reports.length === 0 ? (
                  <li className="text-[color:var(--text-muted)]">No linked reports.</li>
                ) : (
                  caseRecord.reports.map((report) => (
                    <li
                      key={report.id}
                      className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
                    >
                      <p className="line-clamp-3 text-[color:var(--text-main)]">{report.summary}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        Status: {report.status}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </MacWindow>

            {availableActions.length > 0 ? (
              <MacWindow title="Action Linking" className="p-0">
                <LinkCaseActionForm caseId={caseRecord.id} actions={availableActions} />
              </MacWindow>
            ) : null}
          </div>
        </div>
      </MacWindow>
    </div>
  );
}
