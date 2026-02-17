import Link from "next/link";
import { DispatchCallStatus, DispatchUnitStatus } from "@prisma/client";

import { DispatchToolbar } from "@/components/dispatch/dispatch-toolbar";
import { DispatchAssignUnitForm } from "@/components/dispatch/dispatch-assign-unit-form";
import { DispatchCallStatusForm } from "@/components/dispatch/dispatch-call-status-form";
import { DispatchMapFrame } from "@/components/dispatch/dispatch-map-frame";
import { DispatchLoadErrorPanel } from "@/components/dispatch/dispatch-load-error-panel";
import { DispatchUnassignUnitButton } from "@/components/dispatch/dispatch-unassign-unit-button";
import { CallLocationActions } from "@/components/dispatch/call-location-actions";
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
import { dispatchCallStatusVariant, dispatchUnitStatusVariant } from "@/lib/presenters";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { getDispatchCallById, listDispatchCalls, listDispatchUnits } from "@/lib/services/dispatch";
import { getMapSettings } from "@/lib/services/map-settings";

function parseDispatchLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown dispatch error.";
  const missingMapColumns =
    message.includes("DispatchCall.mapX") ||
    message.includes("DispatchCall.mapY") ||
    message.includes("P2022");

  if (missingMapColumns) {
    return {
      title: "Dispatch schema mismatch",
      message:
        "Dispatch could not read map coordinates because your database schema is behind. Run Prisma migrations and retry.",
    };
  }

  return {
    title: "Dispatch failed to load",
    message: "An unexpected error occurred while loading dispatch data. Retry to continue.",
  };
}

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{
    callId?: string;
    status?: string;
    q?: string;
    map?: string;
    cursor?: string;
  }>;
}) {
  const actor = await requirePermission(Permission.DISPATCH_READ);
  const { callId, status, q, map, cursor } = await searchParams;

  const statusFilter: DispatchCallStatus | null =
    status && Object.values(DispatchCallStatus).includes(status as DispatchCallStatus)
      ? (status as DispatchCallStatus)
      : null;
  const query = typeof q === "string" ? q.trim() : "";
  const mapEnabled = map === "1";

  const selectedId = typeof callId === "string" && callId.trim() ? callId.trim() : null;
  const canManage = actor.permissions.includes(Permission.DISPATCH_MANAGE);
  const canManageMap = actor.permissions.includes(Permission.MAP_MANAGE_LAYERS);

  let calls: Awaited<ReturnType<typeof listDispatchCalls>>["items"] = [];
  let units: Awaited<ReturnType<typeof listDispatchUnits>>["items"] = [];
  let nextCursor: string | null = null;
  let mapSettings: Awaited<ReturnType<typeof getMapSettings>> | null = null;
  let selectedCall: Awaited<ReturnType<typeof getDispatchCallById>> | null = null;
  let loadError: { title: string; message: string; debug: string } | null = null;

  try {
    const [callsPage, unitsPage] = await Promise.all([
      listDispatchCalls({
        communityId: actor.communityId,
        status: statusFilter,
        q: query || null,
        take: 90,
        cursor: cursor ?? null,
      }),
      listDispatchUnits({ communityId: actor.communityId, take: 250 }),
    ]);
    calls = callsPage.items;
    units = unitsPage.items;
    nextCursor = callsPage.nextCursor;

    mapSettings = mapEnabled ? await getMapSettings(actor.communityId) : null;
    selectedCall = selectedId
      ? await getDispatchCallById({ communityId: actor.communityId, callId: selectedId })
      : null;
  } catch (error) {
    const parsed = parseDispatchLoadError(error);
    const details = error instanceof Error ? (error.stack ?? error.message) : String(error);
    loadError = { title: parsed.title, message: parsed.message, debug: details };
    console.error("[dispatch] failed to load dispatch view", error);
  }

  const baseParams = new URLSearchParams();
  if (statusFilter) baseParams.set("status", statusFilter);
  if (query) baseParams.set("q", query);
  if (mapEnabled) baseParams.set("map", "1");
  if (typeof cursor === "string" && cursor.trim()) baseParams.set("cursor", cursor.trim());

  return (
    <ConsoleLayout
      storageKey="dispatch"
      title="Dispatch"
      toolbar={<DispatchToolbar status={statusFilter ?? "all"} q={query} />}
      list={
        <div className="flex h-full min-h-0 flex-col">
          {mapEnabled && !loadError ? (
            <DispatchMapFrame
              communityId={actor.communityId}
              calls={calls.map((c) => ({
                id: c.id,
                title: c.title,
                priority: c.priority,
                status: c.status,
                lat: c.lat ?? null,
                lng: c.lng ?? null,
                mapX: c.mapX ?? null,
                mapY: c.mapY ?? null,
              }))}
              units={units.map((u) => ({
                id: u.id,
                callSign: u.callSign,
                type: u.type,
                status: u.status,
                assignedCallId: u.assignedCallId ?? null,
                lastLat: u.lastLat ?? null,
                lastLng: u.lastLng ?? null,
              }))}
              canManageLayers={canManageMap}
              selectedCallId={selectedId}
              styleUrl={mapSettings?.styleUrl}
            />
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            {loadError ? (
              <DispatchLoadErrorPanel
                title={loadError.title}
                message={loadError.message}
                debugDetails={loadError.debug}
                canCopyDebug={process.env.NODE_ENV !== "production" || actor.role === "OWNER"}
              />
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                          No dispatch calls yet
                        </p>
                        <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">
                          Create your first call from the toolbar, then assign units and update
                          status in the inspector.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {calls.map((call) => {
                    const active = call.id === selectedId;
                    return (
                      <TableRow
                        key={call.id}
                        className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={(() => {
                              const params = new URLSearchParams(baseParams);
                              params.set("callId", call.id);
                              return `/app/dispatch?${params.toString()}`;
                            })()}
                            className="ui-transition block rounded-md hover:underline"
                          >
                            {call.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-[color:var(--text-muted)]">
                          P{call.priority}
                        </TableCell>
                        <TableCell>
                          <Badge variant={dispatchCallStatusVariant(call.status)}>
                            {call.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[color:var(--text-muted)]">
                          {call.locationName ?? "-"}
                        </TableCell>
                        <TableCell className="text-[color:var(--text-muted)]">
                          {formatRelativeTime(call.updatedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {nextCursor && !loadError ? (
              <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2">
                <Link
                  href={(() => {
                    const params = new URLSearchParams(baseParams);
                    if (mapEnabled) params.set("map", "1");
                    params.set("cursor", nextCursor);
                    return `/app/dispatch?${params.toString()}`;
                  })()}
                  className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                >
                  Next
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      }
      inspector={
        selectedCall ? (
          <div className="space-y-3">
            <MacWindow
              title={selectedCall.title}
              subtitle="Dispatch call"
              className="bg-[color:var(--surface-strong)]"
              contentClassName="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={dispatchCallStatusVariant(selectedCall.status)}>
                  {selectedCall.status}
                </Badge>
                <span className="text-xs text-[color:var(--text-muted)]">
                  P{selectedCall.priority}
                </span>
              </div>

              <dl className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Location</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedCall.locationName ?? "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Created</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {formatDateTime(selectedCall.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[color:var(--text-muted)]">Created by</dt>
                  <dd className="text-[color:var(--text-main)]">
                    {selectedCall.createdByUser.name}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Status
                </p>
                <DispatchCallStatusForm
                  callId={selectedCall.id}
                  currentStatus={selectedCall.status}
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                  Description
                </p>
                <p className="text-[13px] text-[color:var(--text-main)] whitespace-pre-wrap">
                  {selectedCall.description ? selectedCall.description : "-"}
                </p>
              </div>

              <CallLocationActions
                callId={selectedCall.id}
                title={selectedCall.title}
                mapX={selectedCall.mapX ?? null}
                mapY={selectedCall.mapY ?? null}
              />
            </MacWindow>

            <MacWindow
              title="Assignments"
              subtitle="Units attached to this call"
              contentClassName="space-y-2"
            >
              <DispatchAssignUnitForm
                callId={selectedCall.id}
                units={units.map((u) => ({
                  id: u.id,
                  callSign: u.callSign,
                  status: u.status,
                  assignedCallId: u.assignedCallId ?? null,
                }))}
                disabled={!canManage}
              />

              {selectedCall.assignments.length === 0 ? (
                <p className="text-[13px] text-[color:var(--text-muted)]">No units assigned.</p>
              ) : (
                <div className="space-y-2">
                  {selectedCall.assignments.slice(0, 8).map((a) => (
                    <div
                      key={a.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                            {a.unit.callSign}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {formatRelativeTime(a.assignedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={dispatchUnitStatusVariant(a.unit.status as DispatchUnitStatus)}
                          >
                            {a.unit.status}
                          </Badge>
                          {canManage ? <DispatchUnassignUnitButton unitId={a.unit.id} /> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MacWindow>

            <MacWindow title="Timeline" subtitle="Recent dispatch events">
              <div className="space-y-2">
                {selectedCall.events.length === 0 ? (
                  <p className="text-[13px] text-[color:var(--text-muted)]">No events recorded.</p>
                ) : (
                  selectedCall.events.slice(0, 10).map((e) => (
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
            Select a call to view details, change status, and manage assignments.
          </p>
        </div>
      }
    />
  );
}
