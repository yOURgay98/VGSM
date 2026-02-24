import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PlatformTemplatesPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <ModulePreviewPage
      title="Templates"
      description="Reusable moderation, dispatch, and communication templates."
      status="Early access"
      statusSummary="Template standards are available for review so teams can align naming, ownership, and quality before publishing."
      whyItMatters="Consistent templates reduce response variance and improve operator speed during high-volume moderation windows."
      primaryActionLabel="Create template"
      availableNow={[
        {
          title: "Template standards",
          body: "Reference formatting guidance for moderation notes, escalation summaries, and dispatch updates.",
        },
        {
          title: "Ownership model",
          body: "Define role-based owners for each template category and keep updates audit-traceable.",
        },
        {
          title: "Approval-ready drafts",
          body: "Draft templates with validation checks to avoid malformed placeholders and policy drift.",
        },
        {
          title: "Usage alignment",
          body: "Map template families to reports, cases, dispatch calls, and command responses.",
        },
      ]}
      rolloutPlan={[
        "Unlock template publishing for approved moderators and admins.",
        "Add version history with diff view and rollback controls.",
        "Enable per-community template packs and scoped sharing.",
        "Expose template analytics to track adoption and response quality.",
      ]}
    />
  );
}
