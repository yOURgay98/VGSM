"use client";

import { DispatchUnitStatus } from "@prisma/client";
import { useActionState, useMemo } from "react";

import { assignDispatchUnitToCallAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function DispatchAssignUnitForm({
  callId,
  units,
  disabled,
}: {
  callId: string;
  units: Array<{
    id: string;
    callSign: string;
    status: DispatchUnitStatus;
    assignedCallId: string | null;
  }>;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(assignDispatchUnitToCallAction, initialState);

  const selectable = useMemo(() => {
    return units
      .filter((u) => !u.assignedCallId || u.assignedCallId === callId)
      .filter((u) => u.status !== DispatchUnitStatus.UNAVAILABLE)
      .sort((a, b) => a.callSign.localeCompare(b.callSign));
  }, [callId, units]);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="callId" value={callId} />
      <select
        name="unitId"
        className="input-neutral ui-transition h-8 w-[180px] px-3 text-[13px]"
        disabled={disabled || selectable.length === 0}
        defaultValue={selectable[0]?.id ?? ""}
      >
        {selectable.length === 0 ? <option value="">No available units</option> : null}
        {selectable.map((u) => (
          <option key={u.id} value={u.id}>
            {u.callSign}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={disabled || pending || selectable.length === 0}
      >
        {pending ? "Assigning..." : "Assign"}
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
