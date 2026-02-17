import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "ui-transition inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text-main)] shadow-[var(--panel-shadow)] hover:bg-white/90 dark:hover:bg-white/[0.12]",
        primary:
          "border border-transparent bg-[var(--accent)] text-white shadow-[var(--panel-shadow)] hover:brightness-[1.04]",
        destructive: "border border-transparent bg-[#ff453a] text-white hover:brightness-[1.04]",
        ghost:
          "text-[color:var(--text-muted)] hover:bg-black/[0.03] hover:text-[color:var(--text-main)] dark:hover:bg-white/[0.08]",
        outline:
          "border border-[color:var(--border-strong)] bg-transparent text-[color:var(--text-main)] hover:bg-white/50 dark:hover:bg-white/[0.06]",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 rounded-md px-2 text-xs",
        lg: "h-9 px-4 text-sm",
        icon: "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
