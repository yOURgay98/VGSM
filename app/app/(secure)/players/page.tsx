import Link from "next/link";

import { PlayerQuickActionForm } from "@/components/forms/player-quick-action-form";
import { UpdatePlayerForm } from "@/components/forms/update-player-form";
import { PlayersToolbar } from "@/components/players/players-toolbar";
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
import { actionTypeVariant, formatActionType, playerStatusVariant } from "@/lib/presenters";
import { requirePermission } from "@/lib/services/auth";
import { getPlayerById, listPlayers } from "@/lib/services/player";
import { listSavedViews } from "@/lib/services/views";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { PlayerStatus, SavedViewScope } from "@prisma/client";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ playerId?: string; status?: string; q?: string; cursor?: string }>;
}) {
  const user = await requirePermission(Permission.PLAYERS_READ);
  const { playerId, status, q, cursor } = await searchParams;
  const statusFilter: PlayerStatus | null =
    status === "ACTIVE" || status === "WATCHED" ? (status as PlayerStatus) : null;
  const query = typeof q === "string" ? q.trim() : "";

  const [playersPage, views] = await Promise.all([
    listPlayers({
      communityId: user.communityId,
      status: statusFilter,
      q: query || null,
      take: 90,
      cursor: cursor ?? null,
    }),
    listSavedViews({
      communityId: user.communityId,
      userId: user.id,
      scope: SavedViewScope.PLAYERS,
    }),
  ]);
  const players = playersPage.items;
  const nextCursor = playersPage.nextCursor;

  const selectedId = typeof playerId === "string" && playerId.trim() ? playerId.trim() : null;
  const selectedPlayer = selectedId
    ? await getPlayerById({ communityId: user.communityId, id: selectedId })
    : null;

  const baseParams = new URLSearchParams();
  if (statusFilter) baseParams.set("status", statusFilter);
  if (query) baseParams.set("q", query);
  if (typeof cursor === "string" && cursor.trim()) baseParams.set("cursor", cursor.trim());

  return (
    <div data-tour="players-console">
      <ConsoleLayout
        storageKey="players"
        title="Players"
        toolbar={
          <PlayersToolbar
            status={statusFilter ?? "all"}
            q={query}
            views={views.map((v) => ({ id: v.id, name: v.name, filtersJson: v.filtersJson }))}
            currentFilters={{
              ...(statusFilter ? { status: statusFilter } : {}),
              ...(query ? { q: query } : {}),
            }}
          />
        }
        list={
          <div className="h-full min-h-0 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roblox</TableHead>
                  <TableHead>Discord</TableHead>
                  <TableHead>Last Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                        No players yet
                      </p>
                      <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">
                        Add your first player from the toolbar, then use quick actions and notes
                        from the inspector.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : null}
                {players.map((player, idx) => {
                  const active = player.id === selectedId;
                  return (
                    <TableRow
                      key={player.id}
                      className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                    >
                      <TableCell className="font-medium">
                        <Link
                          href={(() => {
                            const params = new URLSearchParams(baseParams);
                            params.set("playerId", player.id);
                            return `/app/players?${params.toString()}`;
                          })()}
                          data-tour={idx === 0 ? "players-row-first" : undefined}
                          className="ui-transition block rounded-md hover:underline"
                        >
                          {player.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={playerStatusVariant(player.status)}>{player.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[color:var(--text-muted)]">
                        {player.robloxId ?? "-"}
                      </TableCell>
                      <TableCell className="text-[color:var(--text-muted)]">
                        {player.discordId ?? "-"}
                      </TableCell>
                      <TableCell className="text-[color:var(--text-muted)]">
                        {player.actions[0]
                          ? formatRelativeTime(player.actions[0].createdAt)
                          : "None"}
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
                    params.delete("playerId");
                    params.set("cursor", nextCursor);
                    return `/app/players?${params.toString()}`;
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
          selectedPlayer ? (
            <div className="space-y-3">
              <MacWindow
                title={selectedPlayer.name}
                subtitle="Player profile"
                className="bg-[color:var(--surface-strong)]"
                contentClassName="space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={playerStatusVariant(selectedPlayer.status)}>
                    {selectedPlayer.status}
                  </Badge>
                  <Link
                    href={`/app/players/${selectedPlayer.id}`}
                    className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
                  >
                    Open full profile
                  </Link>
                </div>

                <dl className="grid gap-2 text-[13px]">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--text-muted)]">Roblox ID</dt>
                    <dd className="text-[color:var(--text-main)]">
                      {selectedPlayer.robloxId ?? "-"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--text-muted)]">Discord ID</dt>
                    <dd className="text-[color:var(--text-main)]">
                      {selectedPlayer.discordId ?? "-"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[color:var(--text-muted)]">Created</dt>
                    <dd className="text-[color:var(--text-main)]">
                      {formatDateTime(selectedPlayer.createdAt)}
                    </dd>
                  </div>
                </dl>
              </MacWindow>

              <MacWindow
                title="Notes & Status"
                subtitle="Internal context"
                contentClassName="space-y-2"
              >
                <UpdatePlayerForm
                  playerId={selectedPlayer.id}
                  status={selectedPlayer.status}
                  notes={selectedPlayer.notes}
                />
              </MacWindow>

              <MacWindow
                title="Quick Actions"
                subtitle="Record moderation actions quickly"
                contentClassName="space-y-2"
              >
                <PlayerQuickActionForm playerId={selectedPlayer.id} />
              </MacWindow>

              <MacWindow title="Recent Actions" subtitle="Latest recorded events">
                <div className="space-y-2">
                  {selectedPlayer.actions.length === 0 ? (
                    <p className="text-[13px] text-[color:var(--text-muted)]">
                      No actions recorded.
                    </p>
                  ) : (
                    selectedPlayer.actions.slice(0, 6).map((action) => (
                      <div
                        key={action.id}
                        className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={actionTypeVariant(action.type)}>
                            {formatActionType(action.type)}
                          </Badge>
                          <span className="text-xs text-[color:var(--text-muted)]">
                            {formatRelativeTime(action.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] text-[color:var(--text-main)]">
                          {action.reason}
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
              Select a player from the list to view details and quick actions.
            </p>
          </div>
        }
      />
    </div>
  );
}
