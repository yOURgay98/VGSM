"use client";

import Link from "next/link";
import { useActionState } from "react";

import { seedDemoModeAction } from "@/app/actions/demo-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState = { ok: false, message: "" };

const steps = [
  { title: "Login", href: "/login" },
  { title: "Open role-based dashboard", href: "/app/dashboard" },
  { title: "Create a report", href: "/app/reports" },
  { title: "Convert report to case", href: "/app/reports" },
  { title: "Assign case", href: "/app/cases" },
  { title: "Add case note", href: "/app/cases" },
  { title: "Close case", href: "/app/cases" },
  { title: "Review safe audit events", href: "/app/audit" },
];

export function DemoChecklist() {
  const [state, formAction, pending] = useActionState(seedDemoModeAction, initialState);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Seed example reports/cases/actions for a live demo walkthrough.
          </p>
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            {pending ? "Seeding..." : "Enable Demo Mode"}
          </Button>
        </div>
        <p
          className={cn(
            "mt-2 text-xs",
            state.ok ? "text-emerald-600 dark:text-emerald-300" : "text-[color:var(--text-muted)]",
          )}
        >
          {state.message || " "}
        </p>
      </form>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <p className="text-[13px] font-medium text-[color:var(--text-main)]">Demo checklist</p>
        <ol className="mt-2 space-y-1 text-[13px] text-[color:var(--text-muted)]">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-center justify-between gap-2">
              <span>
                {index + 1}. {step.title}
              </span>
              <Link href={step.href} className="text-[var(--accent)] hover:underline">
                Open
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

