import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function ComplianceRetentionPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Retention"
        description="Configure retention windows for moderation data and operational records"
        helper="Retention controls are disabled until automated archival and legal hold workflows are enabled."
      />
    </div>
  );
}
