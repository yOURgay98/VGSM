"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, name, checked: checkedProp, defaultChecked, onCheckedChange, ...props }, ref) => {
  const controlled = typeof checkedProp === "boolean";
  const [internalChecked, setInternalChecked] = React.useState<boolean>(Boolean(defaultChecked));
  const checked = controlled ? (checkedProp as boolean) : internalChecked;

  return (
    <>
      {name ? <input type="hidden" name={name} value={checked ? "true" : "false"} /> : null}
      <SwitchPrimitives.Root
        className={cn(
          "ui-transition peer inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full border border-black/8 bg-[#c7ccd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#34c759] dark:border-white/10 dark:bg-[#3a3a3f]",
          className,
        )}
        {...props}
        checked={checked}
        onCheckedChange={(next) => {
          if (!controlled) setInternalChecked(next);
          onCheckedChange?.(next);
        }}
        ref={ref}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "ui-transition pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-0 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
          )}
        />
      </SwitchPrimitives.Root>
    </>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
