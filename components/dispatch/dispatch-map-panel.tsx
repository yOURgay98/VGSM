"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MapShell } from "@/components/map/MapShell";

export function DispatchMapPanel({
  communityId,
  calls,
  units,
  canManageLayers,
  selectedCallId,
  styleUrl,
  showControls = true,
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
  showControls?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const baseParams = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

  function selectCall(id: string) {
    const params = new URLSearchParams(baseParams);
    params.set("callId", id);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function selectUnit(id: string) {
    router.push(`/app/dispatch/units?unitId=${encodeURIComponent(id)}`);
  }

  return (
    <MapShell
      communityId={communityId}
      scope="dispatch"
      styleUrl={styleUrl}
      calls={calls}
      units={units}
      canManageLayers={canManageLayers}
      selectedCallId={selectedCallId}
      selectedUnitId={null}
      onSelectCallId={selectCall}
      onSelectUnitId={selectUnit}
      showControls={showControls}
      className="h-full"
    />
  );
}
