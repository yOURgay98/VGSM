"use client";

import { useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  ariaLabel: string;
}

export function SegmentedControl({ value, onChange, options, ariaLabel }: SegmentedControlProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = useMemo(
    () => options.findIndex((option) => option.value === value),
    [options, value],
  );

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-0.5 backdrop-blur-xl"
      onKeyDown={(event) => {
        if (options.length === 0) return;

        const index = activeIndex >= 0 ? activeIndex : 0;

        let nextIndex: number | null = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % options.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + options.length) % options.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = options.length - 1;

        if (nextIndex === null) return;

        event.preventDefault();
        const next = options[nextIndex];
        if (!next) return;

        onChange(next.value);
        // Keep focus within the segmented control for keyboard navigation.
        queueMicrotask(() => buttonRefs.current[nextIndex]?.focus());
      }}
    >
      {options.map((option, index) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            className={cn(
              "ui-transition rounded-md px-2.5 py-1 text-xs font-medium",
              active
                ? "bg-[color:var(--surface-strong)] text-[color:var(--text-main)] shadow-[var(--panel-shadow)]"
                : "text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
