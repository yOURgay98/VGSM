"use client";

import { useActionState } from "react";

import { linkCaseActionAction } from "@/app/actions/case-actions";
import { Button } from "@/components/ui/button";

const initialState = { success: false, message: "" };

export function LinkCaseActionForm({
  caseId,
  actions,
}: {
  caseId: string;
  actions: Array<{ id: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(linkCaseActionAction, initialState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="caseId" value={caseId} />
      <label htmlFor="actionId" className="text-sm font-medium text-[color:var(--text-main)]">
        Link Existing Action
      </label>
      <div className="flex gap-2">
        <select
          id="actionId"
          name="actionId"
          required
          defaultValue=""
          className="input-neutral ui-transition h-9 flex-1 px-3 text-[13px]"
        >
          <option value="" disabled>
            Select action
          </option>
          {actions.map((actionOption) => (
            <option key={actionOption.id} value={actionOption.id}>
              {actionOption.label}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={pending}>
          Link
        </Button>
      </div>
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
