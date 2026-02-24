import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PeoplePerformancePage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <ModulePreviewPage
      title="Performance"
      description="Operational performance analytics for staff teams."
      status="In progress"
      statusSummary="Performance analytics are in staged development with fairness guardrails and role-aware visibility."
      whyItMatters="Balanced performance insights help improve team operations without encouraging unsafe speed-over-quality behavior."
      primaryActionLabel="Create performance board"
      availableNow={[
        {
          title: "Metric framework",
          body: "Review metrics focused on quality, response consistency, and escalation accuracy.",
        },
        {
          title: "Fairness safeguards",
          body: "Inspect constraints that prevent punitive interpretation of context-heavy moderation work.",
        },
        {
          title: "Role-based views",
          body: "Plan separate visibility for individual contributors, leads, and owners.",
        },
        {
          title: "Coaching workflow",
          body: "Prepare feedback templates that tie improvements to policy goals and training plans.",
        },
      ]}
      rolloutPlan={[
        "Launch scorecards for admins and team leads.",
        "Add trend overlays with training completion context.",
        "Enable coaching note workflows tied to case outcomes.",
        "Ship role-safe exports for leadership reviews.",
      ]}
    />
  );
}
