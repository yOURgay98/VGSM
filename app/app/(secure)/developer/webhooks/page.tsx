import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function DeveloperWebhooksPage() {
  await requirePermission(Permission.API_KEYS_MANAGE);

  return (
    <ModulePreviewPage
      title="Webhooks"
      description="Outbound event delivery for external tooling."
      status="In progress"
      statusSummary="Webhook foundations are active in preview with endpoint policy checks and signing requirements."
      whyItMatters="Reliable outbound events let communities integrate moderation and dispatch activity with external systems."
      primaryActionLabel="Create endpoint"
      availableNow={[
        {
          title: "Delivery contract",
          body: "Inspect the event payload schema, retry policy, and delivery state lifecycle before endpoints go live.",
        },
        {
          title: "Signature policy",
          body: "Review HMAC signing requirements and header format used to verify inbound authenticity.",
        },
        {
          title: "Endpoint readiness",
          body: "Use checklist guidance for HTTPS, timeout tolerance, and idempotent event handling.",
        },
        {
          title: "Security boundaries",
          body: "Webhook management remains restricted to API key managers with full audit traceability.",
        },
      ]}
      rolloutPlan={[
        "Enable endpoint registration with verification challenge flow.",
        "Ship signed event delivery and retry telemetry.",
        "Add endpoint health dashboard with failure diagnostics.",
        "Expose webhook replay for authorized incident recovery.",
      ]}
    />
  );
}
