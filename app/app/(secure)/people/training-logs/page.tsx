import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeopleTrainingLogsPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <ModulePreviewPage
      title="Training Logs"
      description="Track moderator onboarding and policy training completion."
      status="Planned"
      statusSummary="Training logging is planned with completion tracking and policy attestation support."
      whyItMatters="Training visibility ensures moderators handling sensitive workflows are properly prepared and certified."
      primaryActionLabel="Create training track"
      availableNow={[
        {
          title: "Curriculum model",
          body: "Review the default module structure for onboarding, policy refreshers, and escalation drills.",
        },
        {
          title: "Completion policy",
          body: "Define what counts as complete and which roles require recurring training renewals.",
        },
        {
          title: "Attestation standards",
          body: "Prepare acknowledgement wording for policy updates that require explicit staff confirmation.",
        },
        {
          title: "Audit alignment",
          body: "Plan how training completion will surface in role changes and high-risk action approval flows.",
        },
      ]}
      rolloutPlan={[
        "Enable training track creation with role targeting.",
        "Launch completion tracking and overdue reminders.",
        "Add policy attestation logs with immutable timestamps.",
        "Ship manager dashboards for team readiness reporting.",
      ]}
    />
  );
}
