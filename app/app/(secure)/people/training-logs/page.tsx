import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeopleTrainingLogsPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Training Logs"
        description="Track moderator onboarding and policy training completion"
        helper="Training logs are planned after staff directory foundations are released."
      />
    </div>
  );
}
