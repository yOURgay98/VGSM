import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceTrendsPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Trends"
        description="Trend analysis for incident volume, resolution latency, and policy impact"
        helper="Trend modeling is planned for early access once baseline data quality checks are complete."
      />
    </div>
  );
}
