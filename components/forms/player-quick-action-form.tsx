"use client";

import { useActionState, useState } from "react";
import {
  Ban,
  Eraser,
  Footprints,
  MessageSquareWarning,
  NotebookPen,
  ShieldAlert,
} from "lucide-react";

import { createModerationActionAction } from "@/app/actions/action-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ActionOverflowToolbar } from "@/components/ui/action-overflow-toolbar";

const initialState = { success: false, message: "" };

const options = [
  {
    id: "WARNING",
    label: "Warn",
    icon: <MessageSquareWarning className="h-3.5 w-3.5" />,
    priority: "high" as const,
  },
  {
    id: "KICK",
    label: "Kick",
    icon: <Footprints className="h-3.5 w-3.5" />,
    priority: "high" as const,
  },
  {
    id: "TEMP_BAN",
    label: "Temp Ban",
    icon: <Ban className="h-3.5 w-3.5" />,
    priority: "high" as const,
  },
  {
    id: "PERM_BAN",
    label: "Perm Ban",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
    priority: "high" as const,
  },
  { id: "NOTE", label: "Note", icon: <NotebookPen className="h-3.5 w-3.5" /> },
  { id: "CLEAR", label: "Clear", icon: <Eraser className="h-3.5 w-3.5" /> },
];

export function PlayerQuickActionForm({ playerId }: { playerId: string }) {
  const [actionType, setActionType] = useState("WARNING");
  const [state, action, pending] = useActionState(createModerationActionAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="playerId" value={playerId} />
      <input type="hidden" name="type" value={actionType} />

      <ActionOverflowToolbar
        ariaLabel="Quick action type"
        activeId={actionType}
        onSelect={setActionType}
        actions={options}
        maxInline={5}
      />

      {actionType === "TEMP_BAN" ? (
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
        <Label htmlFor="evidenceUrls">Evidence URLs (newline or comma separated)</Label>
        <Textarea id="evidenceUrls" name="evidenceUrls" className="mt-1 min-h-[70px]" />
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
          {pending ? "Saving..." : "Submit Action"}
        </Button>
      </div>
    </form>
  );
}
