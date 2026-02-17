"use client";

import { useTransition } from "react";

import { runCommandAction } from "@/app/actions/command-actions";
import { assignReportToMeAction } from "@/app/actions/inbox-actions";
import { Button } from "@/components/ui/button";

export function ReportInspectorActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await assignReportToMeAction(reportId);
          })
        }
      >
        Assign to me
      </Button>
      <Button
        size="sm"
        variant="primary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await runCommandAction("case.from_report" as any, { reportId });
          })
        }
      >
        Open case
      </Button>
    </div>
  );
}
