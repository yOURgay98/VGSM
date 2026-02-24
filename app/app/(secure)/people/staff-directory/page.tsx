import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeopleStaffDirectoryPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <ModulePreviewPage
      title="Staff Directory"
      description="Directory of staff members, duty scopes, and escalation ownership."
      status="In progress"
      statusSummary="Staff directory foundations are in preview with role mapping and escalation ownership models."
      whyItMatters="Clear ownership and contact paths reduce delays during critical moderation and dispatch incidents."
      primaryActionLabel="Add staff profile"
      availableNow={[
        {
          title: "Role-to-team mapping",
          body: "Define which teams own case review, escalation approval, dispatch supervision, and security operations.",
        },
        {
          title: "Coverage planning",
          body: "Track staffing coverage by timezone and duty window to reduce handoff friction.",
        },
        {
          title: "Escalation ownership",
          body: "Associate incident categories with primary and fallback owners for faster routing.",
        },
        {
          title: "Directory standards",
          body: "Use profile schema guidelines so future imports remain clean and consistent.",
        },
      ]}
      rolloutPlan={[
        "Enable profile creation and role-linked contact cards.",
        "Add shift schedules and on-call indicators.",
        "Connect staff ownership to moderation and dispatch queues.",
        "Ship profile change history with audit-backed attribution.",
      ]}
    />
  );
}
