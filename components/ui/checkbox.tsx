"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "ui-transition peer h-4 w-4 shrink-0 rounded-[6px] border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] shadow-[var(--panel-shadow)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=checked]:border-[color:var(--accent)] data-[state=checked]:bg-[color:var(--accent-soft)]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-[color:var(--text-main)]">
        <Check className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
