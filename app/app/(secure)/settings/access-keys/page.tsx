import { notFound } from "next/navigation";

import { BetaKeysManager } from "@/components/forms/beta-keys-manager";
import { MacWindow } from "@/components/layout/mac-window";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { listBetaAccessKeys } from "@/lib/services/beta-keys";

export const dynamic = "force-dynamic";

export default async function AccessKeysPage() {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  if (actor.membership.role.name !== "OWNER") {
    notFound();
  }

  const keys = await listBetaAccessKeys({ communityId: actor.communityId });

  return (
    <div className="space-y-3">
      <MacWindow
        title="Access Keys"
        subtitle="Require invite-access keys for new registrations and joins (OWNER only)"
      >
        <BetaKeysManager
          initialKeys={keys.map((k) => ({
            id: k.id,
            label: k.label ?? null,
            maxUses: k.maxUses,
            uses: k.uses,
            expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
            revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
            createdAt: k.createdAt.toISOString(),
            createdByUser: k.createdByUser
              ? { id: k.createdByUser.id, name: k.createdByUser.name, email: k.createdByUser.email }
              : null,
          }))}
        />
      </MacWindow>
    </div>
  );
}
