import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "ui-transition inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--border)] bg-white/58 text-[color:var(--text-main)] dark:bg-white/[0.08]",
        success: "border-emerald-400/35 bg-emerald-400/16 text-emerald-700 dark:text-emerald-300",
        warning: "border-amber-400/35 bg-amber-400/16 text-amber-700 dark:text-amber-300",
        danger: "border-rose-400/35 bg-rose-400/16 text-rose-700 dark:text-rose-300",
        info: "border-sky-400/35 bg-sky-400/16 text-sky-700 dark:text-sky-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
