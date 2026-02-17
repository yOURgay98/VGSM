"use client";

import { useEffect, useMemo, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

import { DispatchMapPanel } from "@/components/dispatch/dispatch-map-panel";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "@/lib/hooks";

const MIN_HEIGHT = 260;
const MAX_HEIGHT = 900;
const DEFAULT_HEIGHT = 420;

export function DispatchMapFrame({
  communityId,
  calls,
  units,
  canManageLayers,
  selectedCallId,
  styleUrl,
}: {
  communityId: string;
  calls: Array<{
    id: string;
    title: string;
    priority: number;
    status: string;
    lat: number | null;
    lng: number | null;
    mapX?: number | null;
    mapY?: number | null;
  }>;
  units: Array<{
    id: string;
    callSign: string;
    type: string;
    status: string;
    assignedCallId: string | null;
    lastLat: number | null;
    lastLng: number | null;
  }>;
  canManageLayers: boolean;
  selectedCallId: string | null;
  styleUrl?: string;
}) {
  const [height, setHeight] = useLocalStorageState<number>("dispatch:mapHeight.v2", DEFAULT_HEIGHT);
  const [focusMode, setFocusMode] = useLocalStorageState<boolean>("dispatch:mapFocus.v2", false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current) return;
      const delta = event.clientY - dragRef.current.startY;
      const viewportCap = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, window.innerHeight - 140));
      const next = Math.min(viewportCap, Math.max(MIN_HEIGHT, dragRef.current.startH + delta));
      setHeight(next);
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setHeight]);

  const effectiveHeight = useMemo(() => {
    if (!focusMode) return height;
    if (typeof window === "undefined") return Math.max(height, 620);
    return Math.max(height, Math.min(MAX_HEIGHT, window.innerHeight - 118));
  }, [focusMode, height]);

  return (
    <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2">
      <div
        className="ui-transition relative overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)]"
        style={{ height: effectiveHeight }}
      >
        <DispatchMapPanel
          communityId={communityId}
          calls={calls}
          units={units}
          canManageLayers={canManageLayers}
          selectedCallId={selectedCallId}
          styleUrl={styleUrl}
        />

        <div className="absolute right-2 top-2 z-30">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setFocusMode((prev) => !prev)}
            aria-label={focusMode ? "Exit map focus mode" : "Enter map focus mode"}
            title={focusMode ? "Exit focus mode" : "Focus map"}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        className="mt-1.5 h-2 cursor-row-resize rounded-full bg-[color:var(--surface)] hover:bg-black/[0.08] dark:hover:bg-white/[0.12]"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragRef.current = { startY: event.clientY, startH: effectiveHeight };
        }}
      />
    </div>
  );
}
