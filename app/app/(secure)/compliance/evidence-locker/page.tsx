import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function ComplianceEvidenceLockerPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <ModulePreviewPage
      title="Evidence Locker"
      description="Immutable evidence vault and chain-of-custody tooling."
      status="Planned"
      statusSummary="Evidence controls are being prepared with strict custody metadata and immutable record guarantees."
      whyItMatters="Formal evidence handling strengthens trust in moderation outcomes and reduces disputes over record authenticity."
      primaryActionLabel="Upload evidence"
      availableNow={[
        {
          title: "Custody checklist",
          body: "Use the documented intake checklist to capture source, collector, incident linkage, and handling expectations.",
        },
        {
          title: "Classification model",
          body: "Tag evidence by type, sensitivity, and retention scope before storage is enabled.",
        },
        {
          title: "Access boundaries",
          body: "Preview who will be allowed to view, export, and attest records once the locker is active.",
        },
        {
          title: "Tamper-awareness plan",
          body: "Review planned hashing and integrity attestations that will be attached to each evidence item.",
        },
      ]}
      rolloutPlan={[
        "Launch secure upload pipeline with role-gated access.",
        "Add immutable hash attestations and custody timeline view.",
        "Enable legal export bundles for approved owners and admins.",
        "Ship evidence-to-case linking with integrity alerts.",
      ]}
    />
  );
}
