"use client";

import { useActionState } from "react";

import { createReportAction } from "@/app/actions/report-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function CreateReportForm({ players }: { players: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(createReportAction, initialState);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="reporterName">Reporter Name</Label>
        <Input id="reporterName" name="reporterName" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="reporterContact">Reporter Contact</Label>
        <Input id="reporterContact" name="reporterContact" className="mt-1" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="accusedPlayerId">Accused Player</Label>
        <select
          id="accusedPlayerId"
          name="accusedPlayerId"
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
          defaultValue=""
        >
          <option value="">Unknown / external</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" required className="mt-1" />
      </div>
      <div className="sm:col-span-2 flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "Create Report"}
        </Button>
      </div>
    </form>
  );
}
