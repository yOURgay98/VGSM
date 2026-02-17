"use client";

import { DispatchUnitStatus } from "@prisma/client";
import { useActionState } from "react";

import { updateDispatchUnitStatusAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

const statusOptions: Array<{ value: DispatchUnitStatus; label: string }> = [
  { value: DispatchUnitStatus.AVAILABLE, label: "Available" },
  { value: DispatchUnitStatus.ASSIGNED, label: "Assigned" },
  { value: DispatchUnitStatus.ENROUTE, label: "Enroute" },
  { value: DispatchUnitStatus.ON_SCENE, label: "On Scene" },
  { value: DispatchUnitStatus.UNAVAILABLE, label: "Unavailable" },
];

export function DispatchUnitStatusForm({
  unitId,
  currentStatus,
  disabled,
}: {
  unitId: string;
  currentStatus: DispatchUnitStatus;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    updateDispatchUnitStatusAction.bind(null, unitId),
    initialState,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="input-neutral ui-transition h-8 w-[180px] px-3 text-[13px]"
        disabled={disabled}
      >
        {statusOptions.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={disabled || pending}>
        {pending ? "Saving..." : "Update"}
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
