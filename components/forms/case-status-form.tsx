"use client";

import { useActionState } from "react";

import { updateCaseStatusAction } from "@/app/actions/case-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function CaseStatusForm({
  caseId,
  status,
}: {
  caseId: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
}) {
  const action = updateCaseStatusAction.bind(null, caseId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <label htmlFor={`case-status-${caseId}`} className="sr-only">
        Case status
      </label>
      <select
        id={`case-status-${caseId}`}
        name="status"
        defaultValue={status}
        className="input-neutral ui-transition h-8 rounded-md px-2 text-xs"
      >
        <option value="OPEN">Open</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
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
