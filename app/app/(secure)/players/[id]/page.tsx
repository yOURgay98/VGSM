import Link from "next/link";
import { notFound } from "next/navigation";

import { PlayerQuickActionForm } from "@/components/forms/player-quick-action-form";
import { UpdatePlayerForm } from "@/components/forms/update-player-form";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { actionTypeVariant, formatActionType, playerStatusVariant } from "@/lib/presenters";
import { getPlayerById } from "@/lib/services/player";
import { requirePermission } from "@/lib/services/auth";
import { logTenantViolationIfExists } from "@/lib/services/tenant";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission(Permission.PLAYERS_READ);
  const { id } = await params;
  const player = await getPlayerById({ communityId: user.communityId, id });

  if (!player) {
    await logTenantViolationIfExists({
      actorUserId: user.id,
      actorCommunityId: user.communityId,
      resource: "player",
      resourceId: id,
      operation: "read",
    });
    notFound();
  }

  return (
    <div className="space-y-2">
      <MacWindow title={player.name} subtitle="Player profile and moderation timeline">
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-2">
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 shadow-[var(--panel-shadow)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                Identifiers
              </p>
              <dl className="mt-2 space-y-1 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--text-muted)]">Roblox ID</dt>
                  <dd>{player.robloxId ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--text-muted)]">Discord ID</dt>
                  <dd>{player.discordId ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[color:var(--text-muted)]">Created</dt>
                  <dd>{formatDateTime(player.createdAt)}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <Badge variant={playerStatusVariant(player.status)}>{player.status}</Badge>
              </div>
            </div>

            <MacWindow title="Quick Actions" contentClassName="p-0">
              <PlayerQuickActionForm playerId={player.id} />
            </MacWindow>

            <MacWindow title="Profile Notes" contentClassName="p-0">
              <UpdatePlayerForm playerId={player.id} status={player.status} notes={player.notes} />
            </MacWindow>
          </div>

          <div className="space-y-2">
            <MacWindow title="Timeline" contentClassName="p-0">
              <ul className="space-y-1.5">
                {player.actions.length === 0 ? (
                  <li className="text-sm text-[color:var(--text-muted)]">No actions recorded.</li>
                ) : (
                  player.actions.map((action) => (
                    <li
                      key={action.id}
                      className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={actionTypeVariant(action.type)}>
                          {formatActionType(action.type)}
                        </Badge>
                        <span className="text-xs text-[color:var(--text-muted)]">
                          {formatRelativeTime(action.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--text-main)]">{action.reason}</p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        Moderator: {action.moderatorUser.name}
                        {action.durationMinutes ? ` | Duration: ${action.durationMinutes}m` : ""}
                      </p>
                      {action.caseActions.length > 0 ? (
                        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                          Linked Cases:{" "}
                          {action.caseActions.map((link, index) => (
                            <span key={link.case.id}>
                              {index > 0 ? ", " : ""}
                              <Link
                                href={`/app/cases/${link.case.id}`}
                                className="ui-transition font-medium text-[var(--accent)] hover:underline"
                              >
                                {link.case.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </MacWindow>

            <div className="grid gap-3 md:grid-cols-2">
              <MacWindow title="Linked Cases" contentClassName="p-0">
                <ul className="space-y-1.5 text-[13px]">
                  {player.casePlayers.length === 0 ? (
                    <li className="text-[color:var(--text-muted)]">No linked cases.</li>
                  ) : (
                    player.casePlayers.map((caseLink) => (
                      <li key={caseLink.case.id}>
                        <Link
                          href={`/app/cases/${caseLink.case.id}`}
                          className="ui-transition font-medium text-[var(--accent)] hover:underline"
                        >
                          {caseLink.case.title}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </MacWindow>

              <MacWindow title="Linked Reports" contentClassName="p-0">
                <ul className="space-y-1.5 text-[13px]">
                  {player.reports.length === 0 ? (
                    <li className="text-[color:var(--text-muted)]">No linked reports.</li>
                  ) : (
                    player.reports.map((report) => (
                      <li key={report.id}>
                        <Link
                          href="/app/reports"
                          className="ui-transition font-medium text-[var(--accent)] hover:underline"
                        >
                          {report.summary.slice(0, 80)}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </MacWindow>
            </div>
          </div>
        </div>
      </MacWindow>
    </div>
  );
}
