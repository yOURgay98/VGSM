import Link from "next/link";

import { CreateActionDialog } from "@/components/forms/create-action-dialog";
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
import { actionTypeVariant, formatActionType } from "@/lib/presenters";
import { listActions } from "@/lib/services/action";
import { listCases } from "@/lib/services/case";
import { listPlayers } from "@/lib/services/player";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function ActionsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; cursor?: string }>;
}) {
  const { scope, cursor } = await searchParams;
  const user = await requirePermission(Permission.ACTIONS_CREATE);
  const [{ items: actions, nextCursor }, playersPage, casesPage] = await Promise.all([
    listActions({ communityId: user.communityId, take: 90, cursor: cursor ?? null }),
    listPlayers({ communityId: user.communityId, take: 200 }),
    listCases({ communityId: user.communityId, take: 200 }),
  ]);
  const players = playersPage.items;
  const cases = casesPage.items;

  const filteredActions =
    scope === "bans"
      ? actions.filter((action) => action.type === "TEMP_BAN" || action.type === "PERM_BAN")
      : actions;

  return (
    <div className="space-y-3">
      <MacWindow
        title={scope === "bans" ? "Ban History" : "Moderation Actions"}
        subtitle="Track and record all moderation outcomes"
      >
        <div className="mb-3 flex justify-end">
          <CreateActionDialog
            players={players.map((player) => ({ id: player.id, name: player.name }))}
            cases={cases.map((caseRecord) => ({ id: caseRecord.id, title: caseRecord.title }))}
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Moderator</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Linked Case</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>
                    <Badge variant={actionTypeVariant(action.type)}>
                      {formatActionType(action.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/app/players/${action.player.id}`} className="hover:underline">
                      {action.player.name}
                    </Link>
                  </TableCell>
                  <TableCell>{action.moderatorUser.name}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={action.reason}>
                    {action.reason}
                  </TableCell>
                  <TableCell>
                    {action.durationMinutes ? `${action.durationMinutes}m` : "-"}
                  </TableCell>
                  <TableCell>
                    {action.caseActions[0] ? (
                      <Link
                        href={`/app/cases/${action.caseActions[0].case.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {action.caseActions[0].case.title}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(action.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {nextCursor ? (
          <div className="mt-3 flex items-center justify-end">
            <Link
              href={`/app/actions?${new URLSearchParams({ ...(scope ? { scope } : {}), cursor: nextCursor }).toString()}`}
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
