"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { runCommandAction } from "@/app/actions/command-actions";
import { Checkbox } from "@/components/ui/checkbox";
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
import { reportStatusVariant } from "@/lib/presenters";
import { formatDateTime } from "@/lib/utils";

type ReportRow = {
  id: string;
  reporterName: string | null;
  reporterContact: string | null;
  summary: string;
  status: string;
  createdAt: Date;
  accusedPlayer: { id: string; name: string; status: string } | null;
  assignedToUser: { id: string; name: string; role: string } | null;
};

export function ReportsList({
  reports,
  selectedId,
  nextCursor,
}: {
  reports: ReportRow[];
  selectedId: string | null;
  nextCursor: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>("");

  const allIds = useMemo(() => reports.map((r) => r.id), [reports]);
  const selectedCount = selected.size;
  const allSelected = selectedCount > 0 && selectedCount === allIds.length;

  function buildHref(reportId: string) {
    const params = new URLSearchParams(searchParams);
    params.set("reportId", reportId);
    return `${pathname}?${params.toString()}`;
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === allIds.length) return new Set();
      return new Set(allIds);
    });
  }

  async function bulkResolve(resolution: "RESOLVED" | "REJECTED") {
    if (selected.size === 0) return;
    setStatus("");

    const reportIds = Array.from(selected);

    startTransition(async () => {
      try {
        await runCommandAction("report.bulk_resolve" as any, {
          reportIds: reportIds.join("\n"),
          resolution,
          note: "",
        });
        setSelected(new Set());
        setStatus(`Bulk ${resolution.toLowerCase()} complete.`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Bulk action failed.");
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {selectedCount ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">
            {selectedCount} selected
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => bulkResolve("RESOLVED")}
            >
              Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => bulkResolve("REJECTED")}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setSelected(new Set());
                setStatus("");
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {status ? (
        <p className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
          {status}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
            <TableRow>
              <TableHead className="w-[44px]">
                <Checkbox
                  aria-label="Select all reports"
                  checked={allSelected}
                  onCheckedChange={() => toggleAll()}
                />
              </TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Accused</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const active = report.id === selectedId;
              const checked = selected.has(report.id);
              return (
                <TableRow
                  key={report.id}
                  className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Select report ${report.id}`}
                      checked={checked}
                      onCheckedChange={() => toggleOne(report.id)}
                    />
                  </TableCell>
                  <TableCell className="text-[color:var(--text-muted)]">
                    {report.reporterName ?? "Anonymous"}
                  </TableCell>
                  <TableCell className="text-[color:var(--text-muted)]">
                    {report.accusedPlayer?.name ?? "Unknown"}
                  </TableCell>
                  <TableCell className="max-w-[420px] truncate" title={report.summary}>
                    <Link
                      href={buildHref(report.id)}
                      className="ui-transition block rounded-md text-[13px] font-medium text-[color:var(--text-main)] hover:underline"
                    >
                      {report.summary}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reportStatusVariant(report.status as any)}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--text-muted)]">
                    {report.assignedToUser?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-[color:var(--text-muted)]">
                    {formatDateTime(report.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {nextCursor ? (
        <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
          <Link
            href={(() => {
              const params = new URLSearchParams(searchParams);
              params.delete("reportId");
              params.set("cursor", nextCursor);
              return `${pathname}?${params.toString()}`;
            })()}
            className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1.5 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
