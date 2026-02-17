import { MacWindow } from "@/components/layout/mac-window";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { listAuditLogs } from "@/lib/services/audit-viewer";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requirePermission(Permission.AUDIT_READ);
  const params = await searchParams;
  const userId = typeof params.userId === "string" ? params.userId : undefined;
  const eventType = typeof params.eventType === "string" ? params.eventType : undefined;
  const from = typeof params.from === "string" && params.from ? new Date(params.from) : undefined;
  const to = typeof params.to === "string" && params.to ? new Date(params.to) : undefined;
  const cursor =
    typeof params.cursor === "string" && params.cursor.trim() ? Number(params.cursor) : NaN;

  const [{ logs, integrity, nextCursor }, users, eventTypes] = await Promise.all([
    listAuditLogs({
      communityId: actor.communityId,
      filter: { userId, eventType, from, to },
      take: 180,
      cursor: Number.isFinite(cursor) ? cursor : null,
    }),
    prisma.communityMembership.findMany({
      where: { communityId: actor.communityId, user: { disabledAt: null } },
      select: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.auditLog.findMany({
      where: { communityId: actor.communityId },
      distinct: ["eventType"],
      select: { eventType: true },
      orderBy: { eventType: "asc" },
    }),
  ]);

  return (
    <div className="space-y-2">
      <MacWindow title="Audit Logs" subtitle="Track security-sensitive and moderation events">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Integrity:{" "}
            <span
              className={
                integrity.ok
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-rose-600 dark:text-rose-300"
              }
            >
              {integrity.ok ? (integrity.partial ? "OK (partial)" : "OK") : "BROKEN"}
            </span>
            {!integrity.ok && integrity.firstBrokenChainIndex ? (
              <span className="ml-2 text-xs text-[color:var(--text-muted)]">
                First broken index: {integrity.firstBrokenChainIndex}
              </span>
            ) : null}
          </p>
        </div>
        <form className="mb-2 grid gap-3 md:grid-cols-4">
          <div>
            <label htmlFor="userId" className="text-sm font-medium">
              User
            </label>
            <select
              id="userId"
              name="userId"
              defaultValue={userId ?? ""}
              className="input-neutral ui-transition mt-1 h-8 w-full px-3 text-[13px]"
            >
              <option value="">All users</option>
              {users.map((row) => (
                <option key={row.user.id} value={row.user.id}>
                  {row.user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="eventType" className="text-sm font-medium">
              Event Type
            </label>
            <select
              id="eventType"
              name="eventType"
              defaultValue={eventType ?? ""}
              className="input-neutral ui-transition mt-1 h-8 w-full px-3 text-[13px]"
            >
              <option value="">All events</option>
              {eventTypes.map((event) => (
                <option key={event.eventType} value={event.eventType}>
                  {event.eventType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="from" className="text-sm font-medium">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={typeof params.from === "string" ? params.from : ""}
              className="input-neutral ui-transition mt-1 h-8 w-full px-3 text-[13px]"
            />
          </div>

          <div>
            <label htmlFor="to" className="text-sm font-medium">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={typeof params.to === "string" ? params.to : ""}
              className="input-neutral ui-transition mt-1 h-8 w-full px-3 text-[13px]"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="submit"
              className="ui-transition h-8 rounded-[var(--radius-control)] bg-[var(--accent)] px-3 text-[13px] font-medium text-white hover:brightness-[1.04]"
            >
              Apply
            </button>
            <a
              href="/app/audit"
              className="ui-transition h-8 rounded-[var(--radius-control)] border border-[color:var(--border)] px-3 text-[13px] leading-8 text-[color:var(--text-main)] hover:bg-white/50 dark:hover:bg-white/[0.06]"
            >
              Reset
            </a>
          </div>
        </form>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell>{log.user?.name ?? "System"}</TableCell>
                  <TableCell>{log.eventType}</TableCell>
                  <TableCell>{log.ip ?? "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={log.userAgent ?? ""}>
                    {log.userAgent ?? "-"}
                  </TableCell>
                  <TableCell>
                    <code className="line-clamp-2 max-w-[360px] text-xs">
                      {log.metadataJson ? JSON.stringify(log.metadataJson) : "-"}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {nextCursor ? (
          <div className="mt-3 flex items-center justify-end">
            <a
              href={(() => {
                const next = new URLSearchParams();
                if (userId) next.set("userId", userId);
                if (eventType) next.set("eventType", eventType);
                if (typeof params.from === "string" && params.from) next.set("from", params.from);
                if (typeof params.to === "string" && params.to) next.set("to", params.to);
                next.set("cursor", nextCursor);
                return `/app/audit?${next.toString()}`;
              })()}
              className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              Next
            </a>
          </div>
        ) : null}
      </MacWindow>
    </div>
  );
}
