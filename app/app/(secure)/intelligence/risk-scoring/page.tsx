import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceRiskScoringPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Risk Scoring"
        description="Entity-level risk scoring for players, reports, and incident clusters"
        helper="Risk scoring remains disabled until model calibration and explainability tooling pass validation."
      />
    </div>
  );
}
