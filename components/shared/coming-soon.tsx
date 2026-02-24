import { Badge } from "@/components/ui/badge";
import { MacWindow } from "@/components/layout/mac-window";

interface ComingSoonProps {
  title: string;
  description: string;
  helper?: string;
  status?: "Planned" | "In progress" | "Early access";
  capabilities?: string[];
  whyItMatters?: string;
}

const defaultCapabilities = [
  "Guided workflows with role-aware controls.",
  "Structured activity views with audit-ready history.",
  "Policy guardrails and community-scoped settings.",
];

export function ComingSoon({
  title,
  description,
  helper,
  status = "Planned",
  capabilities = defaultCapabilities,
  whyItMatters = "This module is staged to keep workflows predictable while security controls are finalized.",
}: ComingSoonProps) {
  const statusVariant =
    status === "Early access" ? "info" : status === "In progress" ? "warning" : "default";

  return (
    <MacWindow title={title} subtitle={description}>
      <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Module readiness</p>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        <p className="text-[13px] text-[color:var(--text-muted)]">{whyItMatters}</p>

        <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            What this will do
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[13px] text-[color:var(--text-muted)]">
            {capabilities.slice(0, 6).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {helper ? <p className="text-xs text-[color:var(--text-muted)]">{helper}</p> : null}
      </div>
    </MacWindow>
  );
}
