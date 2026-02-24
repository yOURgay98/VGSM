import { ModulePreviewPage } from "@/components/shared/module-preview-page";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function IntelligenceWatchlistPage() {
  await requirePermission(Permission.SECURITY_READ);

  return (
    <ModulePreviewPage
      title="Watchlist"
      description="Track priority entities and escalation criteria across moderation workflows."
      status="Early access"
      statusSummary="Watchlist operations are staged for controlled launch with strict visibility and escalation boundaries."
      whyItMatters="Centralized watchlists keep high-priority entities visible across cases, reports, dispatch calls, and audits."
      primaryActionLabel="Create watchlist policy"
      availableNow={[
        {
          title: "Entity watch categories",
          body: "Review standard categories for high-risk players, repeat incidents, and policy-sensitive investigations.",
        },
        {
          title: "Escalation thresholds",
          body: "Define which event patterns should trigger immediate review versus background monitoring.",
        },
        {
          title: "Ownership assignments",
          body: "Plan role ownership for watchlist triage so alerts always route to accountable operators.",
        },
        {
          title: "Cross-module visibility",
          body: "See where watchlist context will appear in reports, cases, and dispatch inspectors.",
        },
      ]}
      rolloutPlan={[
        "Enable read-only watchlist tagging in case and report workflows.",
        "Add escalation notifications with role-targeted delivery.",
        "Launch watchlist activity timeline with actor attribution.",
        "Enable policy packs for repeatable watchlist configurations.",
      ]}
    />
  );
}
