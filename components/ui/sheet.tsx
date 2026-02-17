"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type SheetSide = "right" | "left";

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />;
}

function SheetContent({
  className,
  side = "right",
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: SheetSide }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn("sheet-overlay fixed inset-0 z-50 bg-black/38 backdrop-blur-[2px]")}
      />
      <DialogPrimitive.Content
        data-side={side}
        className={cn(
          "sheet-content fixed z-50 flex h-[100dvh] w-[min(420px,100vw)] flex-col border border-[color:var(--border)] bg-[color:var(--surface-strong)] shadow-[var(--window-shadow)] backdrop-blur-xl",
          side === "right" ? "right-0 top-0 border-l" : "left-0 top-0 border-r",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ui-transition absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-transparent text-[color:var(--text-muted)] hover:bg-black/[0.03] hover:text-[color:var(--text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] dark:hover:bg-white/[0.08]">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetTrigger };
