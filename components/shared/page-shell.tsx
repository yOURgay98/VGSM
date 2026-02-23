import { MacWindow } from "@/components/layout/mac-window";

interface PageShellProps {
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageShell({ title, description, primaryAction, children }: PageShellProps) {
  return (
    <div className="space-y-3">
      <MacWindow title={title} subtitle={description}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-[13px] text-[color:var(--text-muted)]">{description}</p>
          {primaryAction}
        </div>
      </MacWindow>
      {children}
    </div>
  );
}

