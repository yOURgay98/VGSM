import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function ComplianceEvidenceLockerPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Evidence Locker"
        description="Immutable evidence vault and chain-of-custody tooling"
        helper="Evidence locker workflows are staged for a future release with storage and legal policy controls."
      />
    </div>
  );
}
