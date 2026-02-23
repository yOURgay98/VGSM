"use client";

import { Button } from "@/components/ui/button";

interface DisabledActionProps {
  label: string;
  helper?: string;
  className?: string;
}

export function DisabledAction({
  label,
  helper = "This module is being refined and will be enabled in early access soon.",
  className,
}: DisabledActionProps) {
  return (
    <div className={className}>
      <Button type="button" variant="outline" size="sm" disabled title={helper}>
        {label}
      </Button>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">{helper}</p>
    </div>
  );
}

