import { ControlOverlay } from "@/components/overlay/control-overlay";
import { OverlayProvider } from "@/components/overlay/overlay-provider";

export const dynamic = "force-dynamic";

export default function OverlayPage() {
  return (
    <div className="min-h-[100svh] p-4">
      <OverlayProvider renderOverlay={false}>
        <ControlOverlay standalone />
      </OverlayProvider>
    </div>
  );
}
