import { Badge } from "@/components/ui/badge";
import { MacWindow } from "@/components/layout/mac-window";

interface ComingSoonProps {
  title: string;
  description: string;
  helper?: string;
}

export function ComingSoon({ title, description, helper }: ComingSoonProps) {
  return (
    <MacWindow title={title} subtitle={description}>
      <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Module readiness</p>
          <Badge variant="warning">Coming Soon</Badge>
        </div>
        <p className="text-[13px] text-[color:var(--text-muted)]">
          This module is being refined and will be enabled in early access soon.
        </p>
        {helper ? <p className="text-xs text-[color:var(--text-muted)]">{helper}</p> : null}
      </div>
    </MacWindow>
  );
}

