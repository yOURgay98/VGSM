import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeoplePerformancePage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Performance"
        description="Operational performance analytics for staff teams"
        helper="Performance scoring remains disabled until fairness and policy audit criteria are finalized."
      />
    </div>
  );
}
