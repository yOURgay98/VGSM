"use client";

import { useActionState, useState } from "react";

import { createModerationActionAction } from "@/app/actions/action-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function CreateActionDialog({
  players,
  cases,
}: {
  players: Array<{ id: string; name: string }>;
  cases: Array<{ id: string; title: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("WARNING");
  const [state, action, pending] = useActionState(createModerationActionAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Record Action</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Moderation Action</DialogTitle>
          <DialogDescription>
            Use this panel for warnings, kicks, bans, notes, and clears.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-3">
          <div>
            <Label htmlFor="type">Action Type</Label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
            >
              <option value="WARNING">Warning</option>
              <option value="KICK">Kick</option>
              <option value="TEMP_BAN">Temp Ban</option>
              <option value="PERM_BAN">Perm Ban</option>
              <option value="NOTE">Note</option>
              <option value="CLEAR">Clear</option>
            </select>
          </div>

          <div>
            <Label htmlFor="playerId">Player</Label>
            <select
              id="playerId"
              name="playerId"
              required
              className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
              defaultValue=""
            >
              <option value="" disabled>
                Select player
              </option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {type === "TEMP_BAN" ? (
            <div>
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                defaultValue={60}
                className="mt-1"
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" name="reason" required className="mt-1" />
          </div>

          <div>
            <Label htmlFor="evidenceUrls">Evidence URLs</Label>
            <Textarea id="evidenceUrls" name="evidenceUrls" className="mt-1 min-h-[70px]" />
          </div>

          <div>
            <Label htmlFor="caseId">Link to Case (optional)</Label>
            <select
              id="caseId"
              name="caseId"
              className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
              defaultValue=""
            >
              <option value="">No case</option>
              {cases.map((caseRecord) => (
                <option key={caseRecord.id} value={caseRecord.id}>
                  {caseRecord.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p
              role="status"
              aria-live="polite"
              className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {state.message}
            </p>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving..." : "Save Action"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
