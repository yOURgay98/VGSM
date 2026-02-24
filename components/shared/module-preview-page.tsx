import { MacWindow } from "@/components/layout/mac-window";
import { DisabledAction } from "@/components/shared/disabled-action";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";

type ModuleStatus = "Planned" | "In progress" | "Early access";

interface ModuleItem {
  title: string;
  body: string;
}

interface ModulePreviewPageProps {
  title: string;
  description: string;
  status: ModuleStatus;
  statusSummary: string;
  whyItMatters: string;
  availableNow: ModuleItem[];
  rolloutPlan: string[];
  primaryActionLabel?: string;
  primaryActionHelper?: string;
}

export function ModulePreviewPage({
  title,
  description,
  status,
  statusSummary,
  whyItMatters,
  availableNow,
  rolloutPlan,
  primaryActionLabel,
  primaryActionHelper,
}: ModulePreviewPageProps) {
  const statusVariant =
    status === "Early access" ? "info" : status === "In progress" ? "warning" : "default";

  return (
    <PageShell
      title={title}
      description={description}
      primaryAction={
        primaryActionLabel ? (
          <DisabledAction
            label={primaryActionLabel}
            helper={
              primaryActionHelper ??
              "This action is staged for controlled rollout and will unlock after validation."
            }
            className="min-w-[220px]"
          />
        ) : null
      }
    >
      <MacWindow title="Module status" subtitle="Preview posture and rollout readiness">
        <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">Current stage</p>
            <Badge variant={statusVariant}>{status}</Badge>
          </div>
          <p className="text-[13px] text-[color:var(--text-muted)]">{statusSummary}</p>
          <p className="text-[13px] text-[color:var(--text-muted)]">{whyItMatters}</p>
        </div>
      </MacWindow>

      <MacWindow title="Available now" subtitle="What you can use today">
        <div className="grid gap-2 md:grid-cols-2">
          {availableNow.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3"
            >
              <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{item.title}</p>
              <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </MacWindow>

      <MacWindow title="Rollout plan" subtitle="Near-term delivery path">
        <ol className="space-y-1 text-[13px] text-[color:var(--text-muted)]">
          {rolloutPlan.map((step, index) => (
            <li key={step}>
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[11px] font-semibold text-[color:var(--text-main)]">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </MacWindow>
    </PageShell>
  );
}
