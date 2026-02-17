import { ControlOverlay } from "@/components/overlay/control-overlay";
import { OverlayProvider } from "@/components/overlay/overlay-provider";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function ControlPage() {
  await requirePermission(Permission.COMMANDS_RUN);

  return (
    <div className="p-2 lg:p-3">
      <OverlayProvider renderOverlay={false}>
        <ControlOverlay standalone />
      </OverlayProvider>
    </div>
  );
}
