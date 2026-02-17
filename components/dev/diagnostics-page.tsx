"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listDiagnostics,
  clearDiagnostics,
  type DiagnosticEntry,
} from "@/lib/dev/diagnostics-store";
import { formatDateTime } from "@/lib/utils";

function diagnosticsAsText(entries: DiagnosticEntry[]) {
  return entries
    .map((entry) => {
      return [
        `[${new Date(entry.ts).toISOString()}] ${entry.level.toUpperCase()} x${entry.count}`,
        `route: ${entry.route}`,
        `message: ${entry.message}`,
        entry.stack ? `stack: ${entry.stack}` : "",
        "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
}

export function DiagnosticsPageClient() {
  const [entries, setEntries] = useState<DiagnosticEntry[]>([]);

  useEffect(() => {
    const tick = () => setEntries(listDiagnostics());
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => window.clearInterval(handle);
  }, []);

  const summary = useMemo(() => {
    const counts = { error: 0, warn: 0, unhandledrejection: 0, windowerror: 0 };
    for (const entry of entries) {
      counts[entry.level] += entry.count;
    }
    return counts;
  }, [entries]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Diagnostics</CardTitle>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              Dev-only runtime/error capture. Latest {entries.length} unique entries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const text = diagnosticsAsText(entries);
                await navigator.clipboard.writeText(text);
              }}
            >
              Copy report
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearDiagnostics();
                setEntries([]);
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs text-[color:var(--text-muted)] sm:grid-cols-2 lg:grid-cols-4">
            <p>Errors: {summary.error}</p>
            <p>Warnings: {summary.warn}</p>
            <p>Unhandled: {summary.unhandledrejection}</p>
            <p>Window errors: {summary.windowerror}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="max-h-[62vh] overflow-auto p-0">
          {entries.length === 0 ? (
            <p className="p-4 text-sm text-[color:var(--text-muted)]">
              No diagnostics captured yet.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {entries.map((entry) => (
                <li key={entry.id} className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                      {entry.level}
                    </p>
                    <p className="text-xs text-[color:var(--text-muted)]">
                      {formatDateTime(new Date(entry.ts))} · x{entry.count}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--text-main)]">{entry.message}</p>
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    Route: {entry.route}
                  </p>
                  {entry.stack ? (
                    <pre className="mt-2 overflow-auto rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 text-[11px] text-[color:var(--text-muted)]">
                      {entry.stack}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
