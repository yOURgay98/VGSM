import { ComingSoon } from "@/components/shared/coming-soon";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function PlatformTemplatesPage() {
  await requirePermission(Permission.PLAYERS_READ);

  return (
    <div className="space-y-3">
      <ComingSoon
        title="Templates"
        description="Reusable moderation, dispatch, and communication templates"
        helper="Template authoring is intentionally disabled until workflow ownership and approval models are finalized."
      />
    </div>
  );
}
