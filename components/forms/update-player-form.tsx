"use client";

import { useActionState } from "react";

import { updatePlayerAction } from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function UpdatePlayerForm({
  playerId,
  status,
  notes,
}: {
  playerId: string;
  status: "ACTIVE" | "WATCHED";
  notes: string | null;
}) {
  const action = updatePlayerAction.bind(null, playerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          <option value="ACTIVE">Active</option>
          <option value="WATCHED">Watched</option>
        </select>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={notes ?? ""} className="mt-1" />
      </div>

      <div className="flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Update Player"}
        </Button>
      </div>
    </form>
  );
}
