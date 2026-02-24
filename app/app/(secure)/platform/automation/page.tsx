import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PlatformAutomationPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <ModulePreviewPage
      title="Automation"
      description="Workflow automation, conditional routing, and operational playbooks."
      status="In progress"
      statusSummary="Automation is in controlled preview. Rule authoring and guardrail simulation are open, while execution remains protected."
      whyItMatters="Safe automation reduces manual workload without bypassing approvals, permissions, or audit integrity."
      primaryActionLabel="Create workflow"
      availableNow={[
        {
          title: "Playbook coverage map",
          body: "See which moderation and dispatch workflows are eligible for automation and which still require manual approval.",
        },
        {
          title: "Guardrail matrix",
          body: "Review permission and approval requirements before any workflow can be promoted from preview to active.",
        },
        {
          title: "Dry-run simulation",
          body: "Validate trigger logic and expected outcomes without dispatching real actions to moderators or command handlers.",
        },
        {
          title: "Change accountability",
          body: "Workflow edits are tracked in audit history with actor, timestamp, and policy version references.",
        },
      ]}
      rolloutPlan={[
        "Ship workflow templates for report triage, assignment, and escalation routing.",
        "Enable owner-approved execution mode for low-risk automations.",
        "Add execution analytics and rollback history for rapid incident response.",
        "Open advanced conditions and scheduled runs after policy validation.",
      ]}
    />
  );
}
