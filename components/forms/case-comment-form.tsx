"use client";

import { useActionState } from "react";

import { addCaseCommentAction } from "@/app/actions/case-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState = { success: false, message: "" };

export function CaseCommentForm({ caseId }: { caseId: string }) {
  const action = addCaseCommentAction.bind(null, caseId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="comment-body" className="sr-only">
        Add comment
      </label>
      <Textarea id="comment-body" name="body" required placeholder="Add case update" />
      <div className="flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
