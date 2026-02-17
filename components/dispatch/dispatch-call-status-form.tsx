"use client";

import { DispatchCallStatus } from "@prisma/client";
import { useActionState } from "react";

import { transitionDispatchCallStatusAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

const statusOptions: Array<{ value: DispatchCallStatus; label: string }> = [
  { value: DispatchCallStatus.OPEN, label: "Open" },
  { value: DispatchCallStatus.ASSIGNED, label: "Assigned" },
  { value: DispatchCallStatus.ENROUTE, label: "Enroute" },
  { value: DispatchCallStatus.ON_SCENE, label: "On Scene" },
  { value: DispatchCallStatus.CLEARED, label: "Cleared" },
  { value: DispatchCallStatus.CANCELLED, label: "Cancelled" },
];

export function DispatchCallStatusForm({
  callId,
  currentStatus,
  disabled,
}: {
  callId: string;
  currentStatus: DispatchCallStatus;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(
    transitionDispatchCallStatusAction.bind(null, callId),
    initialState,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <select
        name="nextStatus"
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
