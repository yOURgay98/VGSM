import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceRiskScoringPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <ModulePreviewPage
      title="Risk Scoring"
      description="Entity-level risk scoring for players, reports, and incident clusters."
      status="In progress"
      statusSummary="Risk scoring is being calibrated for fairness, transparency, and false-positive reduction before activation."
      whyItMatters="A trustworthy scoring layer helps teams triage high-risk incidents faster while keeping decisions explainable."
      primaryActionLabel="Configure scoring policy"
      availableNow={[
        {
          title: "Signal catalog",
          body: "Review planned input signals such as repeat offenses, escalation speed, and linked incident density.",
        },
        {
          title: "Explainability baseline",
          body: "Preview score reason categories that will be displayed to moderators and auditors.",
        },
        {
          title: "Bias safeguards",
          body: "Inspect fairness controls that prevent single-signal dominance and unstable scoring drift.",
        },
        {
          title: "Severity mapping",
          body: "Map risk bands to workflow responses such as review, escalation, or manual approval.",
        },
      ]}
      rolloutPlan={[
        "Enable score previews in read-only mode for selected communities.",
        "Launch explainability panel with score factor breakdowns.",
        "Add calibration controls with confidence thresholds.",
        "Promote risk-triggered routing once validation targets are met.",
      ]}
    />
  );
}
