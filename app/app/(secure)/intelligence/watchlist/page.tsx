import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceWatchlistPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Watchlist"
        description="Track priority entities and escalation criteria across moderation workflows"
        helper="Watchlist automation is queued behind notification and retention control rollout."
      />
    </div>
  );
}
