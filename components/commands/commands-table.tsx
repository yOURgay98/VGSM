"use client";

import { useState, useTransition } from "react";

import { setCommandEnabledAction } from "@/app/actions/command-actions";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type CommandRow = {
  id: string;
  name: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  requiredPermission: string;
  enabled: boolean;
};

export function CommandsTable({
  commands,
  canManage,
}: {
  commands: CommandRow[];
  canManage: boolean;
}) {
  const [rows, setRows] = useState(() => commands);
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Command</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Permission</TableHead>
            <TableHead className="text-right">Enabled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((cmd) => (
            <TableRow key={cmd.id}>
              <TableCell className="font-medium">{cmd.name}</TableCell>
              <TableCell className="max-w-[420px] truncate" title={cmd.description}>
                {cmd.description}
              </TableCell>
              <TableCell>
                <RiskBadge level={cmd.riskLevel} />
              </TableCell>
              <TableCell>
                <code className="text-xs text-[color:var(--text-muted)]">
                  {cmd.requiredPermission}
                </code>
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-2">
                  {!canManage ? (
                    <span className="text-[13px] text-[color:var(--text-muted)]">
                      {cmd.enabled ? "On" : "Off"}
                    </span>
                  ) : (
                    <>
                      <span className="sr-only">{cmd.enabled ? "Enabled" : "Disabled"}</span>
                      <Switch
                        checked={cmd.enabled}
                        disabled={pending}
                        onCheckedChange={(next) => {
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === cmd.id ? { ...r, enabled: Boolean(next) } : r,
                            ),
                          );
                          startTransition(async () => {
                            try {
                              await setCommandEnabledAction(cmd.id as any, Boolean(next));
                            } catch {
                              // Revert on failure.
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === cmd.id ? { ...r, enabled: cmd.enabled } : r,
                                ),
                              );
                            }
                          });
                        }}
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RiskBadge({ level }: { level: CommandRow["riskLevel"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        level === "HIGH"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : level === "MEDIUM"
            ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)]",
      )}
    >
      {level}
    </span>
  );
}
