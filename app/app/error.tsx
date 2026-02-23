"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const canShowDebug = process.env.NODE_ENV !== "production";

  const details = useMemo(() => {
    const digest = typeof error.digest === "string" ? error.digest : "";
    return [
      "VSM error boundary",
      `message: ${error.message}`,
      digest ? `digest: ${digest}` : "",
      error.stack ? `stack:\n${error.stack}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [error]);

  useEffect(() => {
    console.error("[app] Unhandled app-shell error boundary:", error);
  }, [error]);

  return (
    <div className="m-3 rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
        Error
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--text-main)]">
        Something went wrong
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--text-muted)]">
        The console hit an unexpected error while loading the app shell. Retry the navigation, or
        copy details for a bug report.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => reset()}>
          Retry
        </Button>
        {canShowDebug ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(details);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Copied" : "Copy details"}
          </Button>
        ) : null}
      </div>

      {canShowDebug ? (
        <pre className="mt-4 max-h-[280px] overflow-auto rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
          {details}
        </pre>
      ) : (
        <p className="mt-3 text-xs text-[color:var(--text-muted)]">
          If this keeps happening, contact your owner/admin and include digest:{" "}
          {error.digest ?? "n/a"}.
        </p>
      )}
    </div>
  );
}
