"use client";

import { useActionState } from "react";

import { unassignDispatchUnitAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function DispatchUnassignUnitButton({
  unitId,
  disabled,
}: {
  unitId: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    unassignDispatchUnitAction.bind(null, unitId),
    initialState,
  );

  return (
    <form action={action} className="flex items-center gap-2">
      <Button type="submit" size="sm" variant="outline" disabled={disabled || pending}>
        {pending ? "..." : "Unassign"}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
