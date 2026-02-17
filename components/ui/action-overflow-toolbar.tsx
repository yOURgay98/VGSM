"use client";

import { useMemo, useRef } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ActionItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  priority?: "high" | "normal";
};

export function ActionOverflowToolbar({
  actions,
  activeId,
  onSelect,
  maxInline = 6,
  ariaLabel,
}: {
  actions: ActionItem[];
  activeId: string;
  onSelect: (id: string) => void;
  maxInline?: number;
  ariaLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startLeft: number; dragging: boolean } | null>(null);

  const ordered = useMemo(
    () =>
      [...actions].sort((a, b) => {
        const pa = a.priority === "high" ? 0 : 1;
        const pb = b.priority === "high" ? 0 : 1;
        if (pa !== pb) return pa - pb;
        return a.label.localeCompare(b.label);
      }),
    [actions],
  );

  const inline = ordered.slice(0, Math.max(1, maxInline));
  const overflow = ordered.slice(Math.max(1, maxInline));

  return (
    <div
      aria-label={ariaLabel}
      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1"
    >
      <div className="flex items-center gap-1">
        <div
          ref={scrollRef}
          className="min-w-0 flex-1 overflow-x-auto"
          onWheel={(event) => {
            const node = scrollRef.current;
            if (!node) return;
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            event.preventDefault();
            node.scrollLeft += event.deltaY;
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const node = scrollRef.current;
            if (!node) return;
            dragRef.current = { startX: event.clientX, startLeft: node.scrollLeft, dragging: true };
            node.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            const node = scrollRef.current;
            const drag = dragRef.current;
            if (!node || !drag?.dragging) return;
            const delta = event.clientX - drag.startX;
            node.scrollLeft = drag.startLeft - delta;
          }}
          onPointerUp={(event) => {
            const node = scrollRef.current;
            if (node) node.releasePointerCapture?.(event.pointerId);
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          <div className="flex min-w-max items-center gap-1">
            {inline.map((action) => {
              const active = action.id === activeId;
              return (
                <Button
                  key={action.id}
                  type="button"
                  size="sm"
                  variant={active ? "primary" : "outline"}
                  onClick={() => onSelect(action.id)}
                  className={cn(
                    "h-7 gap-1.5 px-2 text-[12px]",
                    active ? "" : "text-[color:var(--text-muted)]",
                  )}
                >
                  {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
                  <span className="whitespace-nowrap">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-7 px-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="ml-1 text-[12px]">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="w-56">
              <DropdownMenuLabel>More actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {overflow.map((action) => (
                <DropdownMenuItem key={action.id} onSelect={() => onSelect(action.id)}>
                  <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                    {action.icon ?? null}
                  </span>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
