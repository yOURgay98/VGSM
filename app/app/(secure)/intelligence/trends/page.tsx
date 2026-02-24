import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceTrendsPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <ModulePreviewPage
      title="Trends"
      description="Trend analysis for incident volume, resolution latency, and policy impact."
      status="In progress"
      statusSummary="Trend analysis is being finalized to surface reliable signals without noisy or misleading spikes."
      whyItMatters="Clear trend visibility helps leadership prioritize staffing, policy tuning, and operational response windows."
      primaryActionLabel="Create trend board"
      availableNow={[
        {
          title: "Metric definitions",
          body: "Review baseline metrics for incident volume, assignment lag, closure velocity, and approval throughput.",
        },
        {
          title: "Segment templates",
          body: "Prepare segmented views by community, category, severity, and moderation team.",
        },
        {
          title: "Time-window presets",
          body: "Use standard windows for hourly, daily, weekly, and monthly performance reviews.",
        },
        {
          title: "Audit correlation plan",
          body: "Understand how trend changes will be correlated with role, policy, and command changes.",
        },
      ]}
      rolloutPlan={[
        "Ship trend board previews with curated metric widgets.",
        "Enable anomaly markers with confidence hints.",
        "Add export packs for admin and owner compliance reviews.",
        "Launch automated weekly summaries for operational leads.",
      ]}
    />
  );
}
