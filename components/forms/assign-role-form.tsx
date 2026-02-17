"use client";

import { useActionState } from "react";

import { assignRoleAction } from "@/app/actions/settings-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function AssignRoleForm({
  targetUserId,
  currentRole,
  disableOwner,
}: {
  targetUserId: string;
  currentRole: "OWNER" | "ADMIN" | "MOD" | "TRIAL_MOD" | "VIEWER";
  disableOwner: boolean;
}) {
  const [state, action, pending] = useActionState(assignRoleAction, initialState);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="targetUserId" value={targetUserId} />
      <label htmlFor={`role-${targetUserId}`} className="sr-only">
        Assign role
      </label>
      <select
        id={`role-${targetUserId}`}
        name="role"
        defaultValue={currentRole}
        className="input-neutral ui-transition h-8 rounded-md px-2 text-xs"
      >
        <option value="OWNER" disabled={disableOwner}>
          OWNER
        </option>
        <option value="ADMIN">ADMIN</option>
        <option value="MOD">MOD</option>
        <option value="TRIAL_MOD">TRIAL_MOD</option>
        <option value="VIEWER">VIEWER</option>
      </select>
      <Button size="sm" type="submit" disabled={pending}>
        Save
      </Button>
      <span className={`text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}>
        {state.message}
      </span>
    </form>
  );
}
