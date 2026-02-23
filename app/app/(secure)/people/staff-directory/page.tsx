import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeopleStaffDirectoryPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Staff Directory"
        description="Directory of staff members, duty scopes, and escalation ownership"
        helper="Staff directory sync is pending HR-style profile controls and approvals."
      />
    </div>
  );
}
