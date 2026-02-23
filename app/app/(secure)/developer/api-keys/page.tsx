import { MacWindow } from "@/components/layout/mac-window";
import { ApiKeysManager } from "@/components/developer/api-keys-manager";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { listApiKeys, normalizeApiKeyPermissions } from "@/lib/services/api-keys";

export default async function DeveloperApiKeysPage() {
  const actor = await requirePermission(Permission.API_KEYS_MANAGE);
  const keys = await listApiKeys({ communityId: actor.communityId });

  return (
    <div className="space-y-3">
      <MacWindow
        title="API Keys"
        subtitle="Manage service credentials for integrations and internal automation"
      >
        <ApiKeysManager
          keys={keys.map((k) => ({
            id: k.id,
            name: k.name,
            createdAt: k.createdAt.toISOString(),
            lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
            revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
            permissions: normalizeApiKeyPermissions(k.permissionsJson),
            createdByUser: k.createdByUser
              ? { id: k.createdByUser.id, name: k.createdByUser.name, email: k.createdByUser.email }
              : null,
          }))}
        />
      </MacWindow>
    </div>
  );
}

