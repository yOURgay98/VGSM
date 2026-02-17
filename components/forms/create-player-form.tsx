"use client";

import { useActionState } from "react";

import { createPlayerAction } from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function CreatePlayerForm() {
  const [state, action, pending] = useActionState(createPlayerAction, initialState);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="player-name">Name</Label>
        <Input id="player-name" name="name" required placeholder="Player name" className="mt-1" />
      </div>

      <div>
        <Label htmlFor="player-roblox">Roblox ID</Label>
        <Input id="player-roblox" name="robloxId" placeholder="Optional" className="mt-1" />
      </div>

      <div>
        <Label htmlFor="player-discord">Discord ID</Label>
        <Input id="player-discord" name="discordId" placeholder="Optional" className="mt-1" />
      </div>

      <div>
        <Label htmlFor="player-status">Status</Label>
        <select
          id="player-status"
          name="status"
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
          defaultValue="ACTIVE"
        >
          <option value="ACTIVE">Active</option>
          <option value="WATCHED">Watched</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="player-notes">Notes</Label>
        <Textarea id="player-notes" name="notes" placeholder="Moderator notes" className="mt-1" />
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
          {pending ? "Saving..." : "Add Player"}
        </Button>
      </div>
    </form>
  );
}
