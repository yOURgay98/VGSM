import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function DeveloperWebhooksPage() {
  await requirePermission(Permission.API_KEYS_MANAGE);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Webhooks"
        description="Outbound event delivery for external tooling"
        helper="Webhook delivery is disabled until retry policies, signature verification, and endpoint health checks are finalized."
      />
    </div>
  );
}
