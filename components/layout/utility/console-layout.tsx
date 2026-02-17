"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export type ConsoleDensity = "compact" | "comfortable";

export function ConsoleLayout({
  storageKey,
  title,
  toolbar,
  list,
  inspector,
  inspectorEmpty,
}: {
  storageKey: string;
  title: string;
  toolbar?: React.ReactNode;
  list: React.ReactNode;
  inspector: React.ReactNode | null;
  inspectorEmpty?: React.ReactNode;
}) {
  const [inspectorOpen, setInspectorOpen] = useLocalStorageState<boolean>(
    `${storageKey}:inspectorOpen`,
    true,
  );
  const [density, setDensity] = useLocalStorageState<ConsoleDensity>(
    `${storageKey}:density`,
    "compact",
  );

  const densityLabel = useMemo(
    () => (density === "compact" ? "Compact" : "Comfortable"),
    [density],
  );

  return (
    <section
      data-density={density}
      className="ui-transition group overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--panel-shadow)] backdrop-blur-lg"
    >
      <header className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {toolbar}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
              aria-label={`Switch density (currently ${densityLabel})`}
              title={`Density: ${densityLabel}`}
            >
              {densityLabel}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={inspectorOpen ? "Hide inspector" : "Show inspector"}
              onClick={() => setInspectorOpen(!inspectorOpen)}
            >
              {inspectorOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-[560px] grid-cols-1",
          inspectorOpen ? "md:grid-cols-[minmax(0,1fr)_360px]" : "md:grid-cols-1",
        )}
      >
        <div
          className={cn("min-w-0", inspectorOpen && "md:border-r md:border-[color:var(--border)]")}
        >
          {list}
        </div>
        {inspectorOpen ? (
          <aside className="min-w-0 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] md:border-t-0">
            <div className="h-full min-h-0 overflow-auto p-3">
              {inspector ?? inspectorEmpty ?? (
                <div className="flex h-full min-h-[220px] items-center justify-center">
                  <p className="text-[13px] text-[color:var(--text-muted)]">
                    Select an item to inspect.
                  </p>
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
