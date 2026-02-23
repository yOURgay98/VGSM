import { MacWindow } from "@/components/layout/mac-window";
import { ErlcSandbox } from "@/components/developer/erlc-sandbox";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function DeveloperSandboxPage() {
  await requirePermission(Permission.API_KEYS_MANAGE);

  return (
    <div className="space-y-3">
      <MacWindow title="Sandbox" subtitle="Safe test surface for integration stubs and workflows">
        <ErlcSandbox />
      </MacWindow>
    </div>
  );
}

