"use client";

import Link from "next/link";
import { useTransition } from "react";

import { approveCommandAction, rejectCommandAction } from "@/app/actions/command-actions";
import { assignCaseToMeAction, assignReportToMeAction } from "@/app/actions/inbox-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type InboxRow =
  | {
      kind: "report";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    }
  | {
      kind: "case";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    }
  | {
      kind: "approval";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    };

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Type</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[170px]">Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-[13px] text-[color:var(--text-muted)]"
              >
                Inbox is clear.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={`${row.kind}:${row.id}`}>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      row.kind === "approval"
                        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : row.kind === "report"
                          ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)]",
                    )}
                  >
                    {row.kind.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="max-w-[520px]">
                  <Link href={row.href} className="ui-transition block rounded-md hover:underline">
                    <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                      {row.title}
                    </p>
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                    {row.meta}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="default">{row.status}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-[13px] text-[color:var(--text-muted)]">
                  {row.createdAtLabel}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {row.kind === "report" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await assignReportToMeAction(row.id);
                          })
                        }
                      >
                        Assign
                      </Button>
                    ) : null}

                    {row.kind === "case" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await assignCaseToMeAction(row.id);
                          })
                        }
                      >
                        Assign
                      </Button>
                    ) : null}

                    {row.kind === "approval" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await approveCommandAction(row.id);
                            })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const reason = window.prompt("Reject reason (optional):") ?? "";
                              await rejectCommandAction(row.id, reason);
                            })
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}

                    <Button size="sm" variant="ghost" asChild>
                      <Link href={row.href}>Open</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
