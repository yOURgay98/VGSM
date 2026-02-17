"use client";

import { useState } from "react";
import { AlertTriangle, Copy, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DispatchLoadErrorPanel({
  title,
  message,
  debugDetails,
  canCopyDebug,
}: {
  title: string;
  message: string;
  debugDetails?: string;
  canCopyDebug: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyDebug() {
    if (!debugDetails) return;
    try {
      await navigator.clipboard.writeText(debugDetails);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid h-full min-h-[280px] place-items-center p-3">
      <div className="w-full max-w-xl rounded-[var(--radius-panel)] border border-amber-500/35 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-300" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
            <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">{message}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.reload();
            }}
          >
            <RefreshCcw className="mr-1.5 h-4 w-4" />
            Retry
          </Button>
          {canCopyDebug && debugDetails ? (
            <Button type="button" variant="outline" onClick={copyDebug}>
              <Copy className="mr-1.5 h-4 w-4" />
              {copied ? "Copied" : "Copy debug details"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
