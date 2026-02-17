"use client";

import { useActionState } from "react";

import { updateReportStatusAction } from "@/app/actions/report-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function ReportStatusForm({
  reportId,
  status,
}: {
  reportId: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
}) {
  const action = updateReportStatusAction.bind(null, reportId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <label htmlFor={`status-${reportId}`} className="sr-only">
        Report status
      </label>
      <select
        id={`status-${reportId}`}
        name="status"
        defaultValue={status}
        className="input-neutral ui-transition h-8 rounded-md px-2 text-xs"
      >
        <option value="OPEN">Open</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="RESOLVED">Resolved</option>
        <option value="REJECTED">Rejected</option>
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
