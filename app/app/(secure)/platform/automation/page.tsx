import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PlatformAutomationPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Automation"
        description="Workflow automation, conditional routing, and operational playbooks"
        helper="Automation is staged for early access after policy simulation and audit-guard validation are complete."
      />
    </div>
  );
}
