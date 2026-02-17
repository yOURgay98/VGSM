"use client";

import { MacWindow } from "@/components/layout/mac-window";
import { Button } from "@/components/ui/button";

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-2">
      <MacWindow title="Profile" subtitle="Account details, security controls, and activity">
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--text-muted)]">
            Something went wrong while loading your profile.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="primary" onClick={reset}>
              Retry
            </Button>
            <a
              href="/app/dashboard"
              className="ui-transition h-8 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-[13px] leading-8 text-[color:var(--text-main)] hover:bg-white/90 dark:hover:bg-white/[0.12]"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </MacWindow>
    </div>
  );
}
