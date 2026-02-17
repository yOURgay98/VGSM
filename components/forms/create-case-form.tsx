"use client";

import { useActionState, useMemo, useState } from "react";

import { createCaseAction } from "@/app/actions/case-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function CreateCaseForm({
  users,
  players,
  reports,
}: {
  users: Array<{ id: string; name: string }>;
  players: Array<{ id: string; name: string }>;
  reports: Array<{ id: string; summary: string }>;
}) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [state, action, pending] = useActionState(createCaseAction, initialState);

  const summaryOptions = useMemo(
    () => reports.map((report) => ({ ...report, label: report.summary.slice(0, 48) })),
    [reports],
  );

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <Label htmlFor="case-title">Title</Label>
        <Input id="case-title" name="title" required className="mt-1" />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="case-description">Description</Label>
        <Textarea id="case-description" name="description" required className="mt-1" />
      </div>

      <div>
        <Label htmlFor="case-status">Status</Label>
        <select
          id="case-status"
          name="status"
          defaultValue="OPEN"
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div>
        <Label htmlFor="assignedToUserId">Assigned Moderator</Label>
        <select
          id="assignedToUserId"
          name="assignedToUserId"
          defaultValue=""
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Involved Players</Label>
        <div className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 text-[13px]">
          {players.map((player) => {
            const checked = selectedPlayers.includes(player.id);
            return (
              <label
                key={player.id}
                className="ui-transition flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/70 dark:hover:bg-white/[0.08]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedPlayers((prev) =>
                      checked ? prev.filter((item) => item !== player.id) : [...prev, player.id],
                    );
                  }}
                />
                {player.name}
              </label>
            );
          })}
        </div>
        <input type="hidden" name="playerIds" value={selectedPlayers.join(",")} />
      </div>

      <div>
        <Label>Linked Reports</Label>
        <div className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 text-[13px]">
          {summaryOptions.map((report) => {
            const checked = selectedReports.includes(report.id);
            return (
              <label
                key={report.id}
                className="ui-transition flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/70 dark:hover:bg-white/[0.08]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setSelectedReports((prev) =>
                      checked ? prev.filter((item) => item !== report.id) : [...prev, report.id],
                    );
                  }}
                />
                {report.label}
              </label>
            );
          })}
        </div>
        <input type="hidden" name="reportIds" value={selectedReports.join(",")} />
      </div>

      <div className="md:col-span-2 flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "Create Case"}
        </Button>
      </div>
    </form>
  );
}
