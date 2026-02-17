"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { revokeOtherSessionsAction, revokeSessionTokenAction } from "@/app/actions/session-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SessionManager({
  sessions,
}: {
  sessions: Array<{
    sessionToken: string;
    current: boolean;
    createdAtLabel: string;
    lastActiveAtLabel: string;
    expiresAtLabel: string;
    ip: string | null;
    userAgent: string | null;
  }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const current = sessions.find((s) => s.current);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Active sessions</p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Revoke sessions you do not recognize.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || !current}
          onClick={() => {
            setMessage("");
            startTransition(async () => {
              const res = await revokeOtherSessionsAction();
              setMessage(res.message);
              router.refresh();
            });
          }}
        >
          {pending ? "Working..." : "Revoke other sessions"}
        </Button>
      </div>

      {message ? (
        <p role="status" aria-live="polite" className="text-xs text-[color:var(--text-muted)]">
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-panel)] border border-[color:var(--border)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Last Active</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>User Agent</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                >
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => (
                <TableRow
                  key={s.sessionToken}
                  className={s.current ? "bg-black/[0.02] dark:bg-white/[0.04]" : undefined}
                >
                  <TableCell className="whitespace-nowrap">
                    {s.lastActiveAtLabel}
                    {s.current ? (
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                        Current
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{s.createdAtLabel}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.expiresAtLabel}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.ip ?? "-"}</TableCell>
                  <TableCell className="max-w-[240px] truncate" title={s.userAgent ?? ""}>
                    {s.userAgent ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending || s.current}
                      onClick={() => {
                        setMessage("");
                        startTransition(async () => {
                          const res = await revokeSessionTokenAction(s.sessionToken);
                          setMessage(res.message);
                          router.refresh();
                        });
                      }}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
