import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function ComplianceRetentionPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <ModulePreviewPage
      title="Retention"
      description="Configure retention windows for moderation data and operational records."
      status="In progress"
      statusSummary="Retention policy controls are in structured preview with safeguards for legal hold and audit integrity."
      whyItMatters="Reliable retention policy prevents accidental data loss while keeping long-lived compliance records manageable."
      primaryActionLabel="Create retention rule"
      availableNow={[
        {
          title: "Policy matrix",
          body: "Review recommended retention baselines by module, including reports, cases, audit events, and dispatch artifacts.",
        },
        {
          title: "Scope inventory",
          body: "Inspect which records are covered by global policy defaults versus module-specific exceptions.",
        },
        {
          title: "Legal hold awareness",
          body: "Identify datasets that should never be purged while active investigations or disputes remain open.",
        },
        {
          title: "Compliance notes",
          body: "Document policy rationale and ownership so future revisions remain reviewable and auditable.",
        },
      ]}
      rolloutPlan={[
        "Enable policy editing with staged approval flow for sensitive modules.",
        "Ship automated archival jobs and retention enforcement logs.",
        "Add legal hold locking with explicit owner acknowledgements.",
        "Expose retention dashboards for audit and compliance review.",
      ]}
    />
  );
}
