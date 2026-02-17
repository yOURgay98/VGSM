import Link from "next/link";
import { DispatchUnitStatus } from "@prisma/client";

import { CreateDispatchUnitDialog } from "@/components/forms/create-dispatch-unit-dialog";
import { DispatchUnitStatusForm } from "@/components/dispatch/dispatch-unit-status-form";
import { DispatchUnassignUnitButton } from "@/components/dispatch/dispatch-unassign-unit-button";
import { ConsoleLayout } from "@/components/layout/utility/console-layout";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dispatchCallStatusVariant, dispatchUnitStatusVariant } from "@/lib/presenters";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getDispatchUnitById, listDispatchUnits } from "@/lib/services/dispatch";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";

export default async function DispatchUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string; cursor?: string }>;
}) {
  const actor = await requirePermission(Permission.DISPATCH_READ);
  const { unitId, cursor } = await searchParams;

  const { items: units, nextCursor } = await listDispatchUnits({
    communityId: actor.communityId,
    take: 180,
    cursor: cursor ?? null,
  });
  const selectedId = typeof unitId === "string" && unitId.trim() ? unitId.trim() : null;
  const selectedUnit = selectedId
    ? await getDispatchUnitById({ communityId: actor.communityId, unitId: selectedId })
    : null;

  const canManage = actor.permissions.includes(Permission.DISPATCH_MANAGE);

  return (
    <ConsoleLayout
      storageKey="dispatch:units"
      title="Units"
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/app/dispatch">Calls</Link>
          </Button>
          <CreateDispatchUnitDialog />
        </div>
      }
      list={
        <div className="h-full min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
              <TableRow>
                <TableHead>Call Sign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => {
                const active = unit.id === selectedId;
                return (
                  <TableRow
                    key={unit.id}
                    className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/dispatch/units?unitId=${unit.id}`}
                        className="ui-transition block rounded-md hover:underline"
                      >
                        {unit.callSign}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">{unit.type}</TableCell>
                    <TableCell>
                      <Badge variant={dispatchUnitStatusVariant(unit.status as DispatchUnitStatus)}>
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {unit.assignedCall ? (
                        <Link
                          href={`/app/dispatch?callId=${unit.assignedCall.id}`}
                          className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
                        >
                          {unit.assignedCall.title}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {formatRelativeTime(unit.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {nextCursor ? (
            <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2">
              <Link
                href={`/app/dispatch/units?cursor=${encodeURIComponent(nextCursor)}`}
                className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
              >
                Next
              </Link>
            </div>
          ) : null}
        </div>
      }
      inspector={
        selectedUnit ? (
          <div className="space-y-3">
            <MacWindow
              title={selectedUnit.callSign}
              subtitle="Dispatch unit"
              className="bg-[color:var(--surface-strong)]"
              contentClassName="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant={dispatchUnitStatusVariant(selectedUnit.status as DispatchUnitStatus)}
                >
                  {selectedUnit.status}
                </Badge>
                <span className="text-xs text-[color:var(--text-muted)]">{selectedUnit.type}</span>
              </div>

              <dl className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Assigned</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedUnit.assignedCall ? selectedUnit.assignedCall.title : "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Updated</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {formatDateTime(selectedUnit.updatedAt)}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Status
                </p>
                <DispatchUnitStatusForm
                  unitId={selectedUnit.id}
                  currentStatus={selectedUnit.status}
                  disabled={!canManage}
                />
              </div>

              {selectedUnit.assignedCall ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                      Assigned Call
                    </p>
                    <Link
                      href={`/app/dispatch?callId=${selectedUnit.assignedCall.id}`}
                      className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
                    >
                      {selectedUnit.assignedCall.title}
                    </Link>
                    <div className="mt-1">
                      <Badge variant={dispatchCallStatusVariant(selectedUnit.assignedCall.status)}>
                        {selectedUnit.assignedCall.status}
                      </Badge>
                    </div>
                  </div>
                  {canManage ? <DispatchUnassignUnitButton unitId={selectedUnit.id} /> : null}
                </div>
              ) : null}
            </MacWindow>

            <MacWindow title="Timeline" subtitle="Recent unit events">
              <div className="space-y-2">
                {selectedUnit.events.length === 0 ? (
                  <p className="text-[13px] text-[color:var(--text-muted)]">No events recorded.</p>
                ) : (
                  selectedUnit.events.slice(0, 10).map((e) => (
                    <div
                      key={e.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[color:var(--text-main)]">
                          {e.type}
                        </span>
                        <span className="text-xs text-[color:var(--text-muted)]">
                          {formatRelativeTime(e.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[color:var(--text-main)]">{e.message}</p>
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
            Select a unit to view details and update status.
          </p>
        </div>
      }
    />
  );
}
