"use client";

import mapLabels from "@/data/map/labels.json";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPinned, Pencil, Trash2, X } from "lucide-react";

import { AddPOIModal } from "@/components/map/controls/add-poi-modal";
import { AddZoneModal } from "@/components/map/controls/add-zone-modal";
import {
  StaticMapCanvas,
  type StaticMapView,
  type ToolPoint,
} from "@/components/map/StaticMapCanvas";
import {
  MapOverlayToolkit,
  type OverlayLayerState,
  type OverlayTool,
  type SessionPing as ToolkitPing,
} from "@/components/map/overlay/MapOverlayToolkit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MapLayerState } from "@/lib/validations/map";

type CallRow = {
  id: string;
  title: string;
  priority: number;
  status: string;
  lat: number | null;
  lng: number | null;
  mapX?: number | null;
  mapY?: number | null;
};

type UnitRow = {
  id: string;
  callSign: string;
  type: string;
  status: string;
  assignedCallId: string | null;
  lastLat: number | null;
  lastLng: number | null;
};

type PoiRow = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  lat: number | null;
  lng: number | null;
  mapX?: number | null;
  mapY?: number | null;
  icon: string | null;
  color: string | null;
};

type ZoneRow = {
  id: string;
  name: string;
  zoneType: string;
  geojson: any;
  color: string | null;
};

type LabelRow = {
  id: string;
  name: string;
  type: "street" | "building" | "landmark";
  postal?: string;
  xNorm?: number;
  yNorm?: number;
  lat?: number;
  lng?: number;
};

type MapViewState = {
  scope: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  enabledLayers: MapLayerState;
};

type SessionPing = {
  id: string;
  mapX: number;
  mapY: number;
  label: string;
  kind: "ping" | "call" | "pick";
};

type ZoneDraftState = "idle" | "drawing" | "ready_to_close" | "completed" | "cancelled";

const LABELS = mapLabels as LabelRow[];
const DEFAULT_LAYERS: MapLayerState = {
  calls: true,
  units: true,
  pois: true,
  zones: true,
  heatmap: false,
  labels: true,
  postalGrid: false,
};
const SNAP_THRESHOLD = 0.015;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeLayerState(raw: Partial<MapLayerState> | null | undefined): MapLayerState {
  return {
    calls: raw?.calls !== false,
    units: raw?.units !== false,
    pois: raw?.pois !== false,
    zones: raw?.zones !== false,
    heatmap: false,
    labels: raw?.labels !== false,
    postalGrid: raw?.postalGrid === true,
  };
}

function isNorm(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
}

function toNormPoint(value: unknown): { x: number; y: number } | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const x = value[0];
  const y = value[1];
  if (!isNorm(x) || !isNorm(y)) return null;
  return { x, y };
}

function findClosestId<T extends { id: string; mapX?: number | null; mapY?: number | null }>(
  rows: T[],
  point: { x: number; y: number },
  threshold = 0.02,
) {
  let best: { id: string; dist: number } | null = null;
  for (const row of rows) {
    if (!isNorm(row.mapX) || !isNorm(row.mapY)) continue;
    const dx = row.mapX - point.x;
    const dy = row.mapY - point.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > threshold) continue;
    if (!best || dist < best.dist) best = { id: row.id, dist };
  }
  return best?.id ?? null;
}

function makeZoneGeojson(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) return null;
  const ring = points.map((p) => [p.x, p.y]);
  const first = ring[0];
  if (!first) return null;
  ring.push([first[0], first[1]]);
  return { type: "Polygon", coordinates: [ring] };
}

function pointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.x;
    const yi = polygon[i]!.y;
    const xj = polygon[j]!.x;
    const yj = polygon[j]!.y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

async function fetchAllPages<T>(url: string, take = 200, maxPages = 8): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < maxPages; i += 1) {
    const u = new URL(url, window.location.origin);
    u.searchParams.set("take", String(take));
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) break;
    const json = (await res.json()) as any;
    const items = (json?.items ?? []) as T[];
    out.push(...items);
    cursor = typeof json?.nextCursor === "string" && json.nextCursor ? json.nextCursor : null;
    if (!cursor || items.length < take) break;
  }
  return out;
}

export function MapShell({
  communityId,
  scope,
  calls,
  units,
  canManageLayers,
  selectedCallId,
  onSelectCallId,
  showControls = true,
  className,
}: {
  communityId: string;
  scope: "dispatch" | "control";
  styleUrl?: string;
  calls: CallRow[];
  units: UnitRow[];
  canManageLayers: boolean;
  selectedCallId: string | null;
  selectedUnitId: string | null;
  onSelectCallId: (id: string) => void;
  onSelectUnitId: (id: string) => void;
  showControls?: boolean;
  className?: string;
}) {
  const [mapReady, setMapReady] = useState(false);
  const [viewState, setViewState] = useState<StaticMapView>({
    centerX: 0.5,
    centerY: 0.5,
    zoom: 1,
  });
  const [layers, setLayers] = useState<MapLayerState>(DEFAULT_LAYERS);
  const [showPingMarkers, setShowPingMarkers] = useState(true);
  const [tool, setTool] = useState<OverlayTool>("none");
  const [pois, setPois] = useState<PoiRow[]>([]);
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [sessionPings, setSessionPings] = useState<SessionPing[]>([]);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [poiModalOpen, setPoiModalOpen] = useState(false);
  const [poiModalMode, setPoiModalMode] = useState<"create" | "edit">("create");
  const [poiModalPoint, setPoiModalPoint] = useState<{ mapX: number; mapY: number }>({
    mapX: 0.5,
    mapY: 0.5,
  });
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneModalMode, setZoneModalMode] = useState<"create" | "edit">("create");
  const [pendingZoneGeojson, setPendingZoneGeojson] = useState<any | null>(null);
  const [zoneDraft, setZoneDraft] = useState<Array<{ x: number; y: number }>>([]);
  const [zoneDraftState, setZoneDraftState] = useState<ZoneDraftState>("idle");

  const saveTimerRef = useRef<number | null>(null);
  const mapReadyRef = useRef(false);

  const selectedPoi = useMemo(
    () => pois.find((item) => item.id === selectedPoiId) ?? null,
    [pois, selectedPoiId],
  );
  const selectedZone = useMemo(
    () => zones.find((item) => item.id === selectedZoneId) ?? null,
    [selectedZoneId, zones],
  );
  const selectedCall = useMemo(
    () => (selectedCallId ? (calls.find((item) => item.id === selectedCallId) ?? null) : null),
    [calls, selectedCallId],
  );

  const unmappedPois = useMemo(
    () => pois.filter((poi) => !isNorm(poi.mapX) || !isNorm(poi.mapY)).length,
    [pois],
  );
  const unmappedZones = useMemo(
    () => zones.filter((zone) => !zoneHasNormalizedGeometry(zone.geojson)).length,
    [zones],
  );

  const layersForToolkit: OverlayLayerState = useMemo(
    () => ({
      calls: layers.calls,
      units: layers.units,
      pings: showPingMarkers,
      grid: layers.postalGrid,
      pois: layers.pois,
      zones: layers.zones,
      labels: layers.labels,
    }),
    [
      layers.calls,
      layers.labels,
      layers.pois,
      layers.postalGrid,
      layers.units,
      layers.zones,
      showPingMarkers,
    ],
  );

  const toolkitPings: ToolkitPing[] = useMemo(
    () => sessionPings.map((ping) => ({ id: ping.id, label: ping.label })),
    [sessionPings],
  );

  const unitMarkers = useMemo(() => {
    return units
      .map((unit) => {
        const call = unit.assignedCallId
          ? (calls.find((entry) => entry.id === unit.assignedCallId) ?? null)
          : null;
        if (!call || !isNorm(call.mapX) || !isNorm(call.mapY)) return null;
        return {
          id: unit.id,
          callSign: unit.callSign,
          mapX: call.mapX,
          mapY: call.mapY,
          status: unit.status,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [calls, units]);

  const labels = useMemo(() => {
    const withNorm = LABELS.filter((label) => isNorm(label.xNorm) && isNorm(label.yNorm));
    if (withNorm.length > 0) return withNorm;

    const latRows = LABELS.filter(
      (label) => typeof label.lat === "number" && typeof label.lng === "number",
    );
    if (latRows.length === 0) return [] as Array<LabelRow & { xNorm: number; yNorm: number }>;

    const minLng = Math.min(...latRows.map((row) => row.lng as number));
    const maxLng = Math.max(...latRows.map((row) => row.lng as number));
    const minLat = Math.min(...latRows.map((row) => row.lat as number));
    const maxLat = Math.max(...latRows.map((row) => row.lat as number));
    const lngSpan = Math.max(0.000001, maxLng - minLng);
    const latSpan = Math.max(0.000001, maxLat - minLat);

    return latRows.map((row) => ({
      ...row,
      xNorm: clamp(((row.lng as number) - minLng) / lngSpan, 0, 1),
      yNorm: clamp(1 - ((row.lat as number) - minLat) / latSpan, 0, 1),
    }));
  }, []);

  async function reloadLayers() {
    const [poiItems, zoneItems] = await Promise.all([
      fetchAllPages<PoiRow>("/api/map/pois", 300, 8),
      fetchAllPages<ZoneRow>("/api/map/zones", 200, 8),
    ]);
    setPois(poiItems);
    setZones(zoneItems);
  }

  useEffect(() => {
    mapReadyRef.current = mapReady;
  }, [mapReady]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [stateRes] = await Promise.all([
          fetch(`/api/map/view-state?scope=${encodeURIComponent(scope)}`, { cache: "no-store" }),
          reloadLayers(),
        ]);
        if (!mounted) return;
        if (stateRes.ok) {
          const json = (await stateRes.json()) as any;
          const state = (json?.state ?? null) as MapViewState | null;
          if (state) {
            setViewState({
              centerX: clamp(Number(state.centerLng) || 0.5, 0, 1),
              centerY: clamp(Number(state.centerLat) || 0.5, 0, 1),
              zoom: clamp(Number(state.zoom) || 1, 0.45, 8),
            });
            setLayers(sanitizeLayerState(state.enabledLayers));
          }
        }
      } finally {
        if (mounted) setMapReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [scope]);

  useEffect(() => {
    if (!mapReadyRef.current) return;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void fetch(`/api/map/view-state?scope=${encodeURIComponent(scope)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          centerLat: viewState.centerY,
          centerLng: viewState.centerX,
          zoom: viewState.zoom,
          enabledLayers: layers,
        }),
      });
    }, 500);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [layers, scope, viewState]);

  useEffect(() => {
    if (!selectedCall || !isNorm(selectedCall.mapX) || !isNorm(selectedCall.mapY)) return;
    setViewState((prev) => ({ ...prev, centerX: selectedCall.mapX!, centerY: selectedCall.mapY! }));
  }, [selectedCall]);

  useEffect(() => {
    const onStartCallPicker = () => setTool("pick_call_location");
    const onPingCoordinate = (event: Event) => {
      const detail = (
        event as CustomEvent<{ callId?: string; mapX?: number; mapY?: number; label?: string }>
      ).detail;
      if (!detail) return;
      if (typeof detail.callId === "string" && detail.callId) {
        const call = calls.find((entry) => entry.id === detail.callId);
        if (call && isNorm(call.mapX) && isNorm(call.mapY)) {
          addSessionPing({
            mapX: call.mapX,
            mapY: call.mapY,
            label: detail.label ?? call.title,
            kind: "call",
          });
        }
        return;
      }
      if (isNorm(detail.mapX) && isNorm(detail.mapY)) {
        addSessionPing({
          mapX: detail.mapX,
          mapY: detail.mapY,
          label: detail.label ?? `Ping ${sessionPings.length + 1}`,
          kind: "ping",
        });
      }
    };
    window.addEventListener(
      "vsm:map-toolkit:start-call-picker",
      onStartCallPicker as EventListener,
    );
    window.addEventListener("vsm:map-toolkit:ping-coordinate", onPingCoordinate as EventListener);
    return () => {
      window.removeEventListener(
        "vsm:map-toolkit:start-call-picker",
        onStartCallPicker as EventListener,
      );
      window.removeEventListener(
        "vsm:map-toolkit:ping-coordinate",
        onPingCoordinate as EventListener,
      );
    };
  }, [calls, sessionPings.length]);

  function addSessionPing(input: {
    mapX: number;
    mapY: number;
    label: string;
    kind: SessionPing["kind"];
  }) {
    setSessionPings((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        mapX: input.mapX,
        mapY: input.mapY,
        label: input.label,
        kind: input.kind,
      },
    ]);
  }

  function onCanvasPoint(point: ToolPoint) {
    const mapPoint = { x: clamp(point.xNorm, 0, 1), y: clamp(point.yNorm, 0, 1) };

    if (point.tool === "none") {
      const poiId = findClosestId(
        pois.map((poi) => ({ id: poi.id, mapX: poi.mapX, mapY: poi.mapY })),
        mapPoint,
      );
      const callId = findClosestId(
        calls.map((call) => ({ id: call.id, mapX: call.mapX, mapY: call.mapY })),
        mapPoint,
      );
      const zoneId =
        zones.find((zone) => {
          const ring = zonePolygonRing(zone.geojson);
          if (!ring) return false;
          return pointInPolygon(mapPoint, ring);
        })?.id ?? null;
      const unitId = findClosestId(
        unitMarkers.map((unit) => ({ id: unit.id, mapX: unit.mapX, mapY: unit.mapY })),
        mapPoint,
      );
      if (poiId) {
        setSelectedPoiId(poiId);
        setSelectedZoneId(null);
        return;
      }
      if (zoneId) {
        setSelectedZoneId(zoneId);
        setSelectedPoiId(null);
        return;
      }
      if (callId) {
        onSelectCallId(callId);
        return;
      }
      if (unitId) {
        return;
      }
      setSelectedPoiId(null);
      setSelectedZoneId(null);
      return;
    }

    if (point.tool === "ping") {
      const defaultLabel = `Ping ${sessionPings.length + 1}`;
      const userLabel =
        typeof window !== "undefined"
          ? window.prompt("Ping label (optional)", defaultLabel)
          : defaultLabel;
      addSessionPing({
        mapX: mapPoint.x,
        mapY: mapPoint.y,
        label: userLabel?.trim() ? userLabel.trim().slice(0, 48) : defaultLabel,
        kind: "ping",
      });
      return;
    }

    if (point.tool === "pick_call_location") {
      addSessionPing({ mapX: mapPoint.x, mapY: mapPoint.y, label: "Call Location", kind: "pick" });
      const text = `${mapPoint.x.toFixed(6)}, ${mapPoint.y.toFixed(6)}`;
      window.dispatchEvent(
        new CustomEvent("vsm:map-toolkit:call-location-picked", {
          detail: {
            mapX: mapPoint.x,
            mapY: mapPoint.y,
            text,
          },
        }),
      );
      setTool("none");
      return;
    }

    if (point.tool === "add_poi") {
      if (!canManageLayers) return;
      setPoiModalMode("create");
      setPoiModalPoint({ mapX: mapPoint.x, mapY: mapPoint.y });
      setPoiModalOpen(true);
      setTool("none");
      return;
    }

    if (point.tool === "draw_zone") {
      if (!canManageLayers) return;
      setZoneDraft((prev) => {
        const next = [...prev];
        const first = next[0];
        if (first && next.length >= 3) {
          const dx = first.x - mapPoint.x;
          const dy = first.y - mapPoint.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= SNAP_THRESHOLD) {
            setZoneDraftState("completed");
            const geojson = makeZoneGeojson(next);
            if (geojson) {
              setPendingZoneGeojson(geojson);
              setZoneModalMode("create");
              setZoneModalOpen(true);
            }
            setTool("none");
            return [];
          }
        }
        next.push(mapPoint);
        setZoneDraftState(next.length >= 3 ? "ready_to_close" : "drawing");
        return next;
      });
    }
  }

  async function deleteSelectedPoi() {
    if (!selectedPoi) return;
    await fetch(`/api/map/pois/${encodeURIComponent(selectedPoi.id)}`, { method: "DELETE" });
    setSelectedPoiId(null);
    await reloadLayers();
  }

  async function deleteSelectedZone() {
    if (!selectedZone) return;
    await fetch(`/api/map/zones/${encodeURIComponent(selectedZone.id)}`, { method: "DELETE" });
    setSelectedZoneId(null);
    await reloadLayers();
  }

  function zonePreviewPolygon(width: number, height: number) {
    if (zoneDraft.length < 2) return null;
    const points = zoneDraft.map((p) => `${p.x * width},${p.y * height}`).join(" ");
    if (!points) return null;
    return points;
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)]",
        className,
      )}
    >
      <StaticMapCanvas
        activeTool={tool}
        viewState={viewState}
        onViewStateChange={setViewState}
        onToolPoint={onCanvasPoint}
        overlays={({ width, height }) => (
          <g>
            {layers.postalGrid ? renderGrid(width, height) : null}

            {layers.zones
              ? zones.map((zone) => {
                  const ring = zonePolygonRing(zone.geojson);
                  if (!ring) return null;
                  const polygonPoints = ring.map((p) => `${p.x * width},${p.y * height}`).join(" ");
                  return (
                    <g key={zone.id}>
                      <polygon
                        points={polygonPoints}
                        fill={zone.color ?? "rgba(10,132,255,0.18)"}
                        fillOpacity={0.22}
                      />
                      <polyline
                        points={polygonPoints}
                        fill="none"
                        stroke={zone.color ?? "rgba(10,132,255,0.95)"}
                        strokeWidth={2}
                      />
                    </g>
                  );
                })
              : null}

            {layers.calls
              ? calls.map((call) => {
                  if (!isNorm(call.mapX) || !isNorm(call.mapY)) return null;
                  const selected = selectedCallId === call.id;
                  return (
                    <g key={call.id}>
                      <circle
                        cx={call.mapX * width}
                        cy={call.mapY * height}
                        r={selected ? 9 : 7}
                        fill={priorityColor(call.priority)}
                        stroke="rgba(15,23,42,0.55)"
                        strokeWidth={selected ? 2 : 1}
                      />
                    </g>
                  );
                })
              : null}

            {layers.units
              ? unitMarkers.map((unit) => (
                  <g key={unit.id}>
                    <rect
                      x={unit.mapX * width - 4}
                      y={unit.mapY * height - 4}
                      width={8}
                      height={8}
                      fill="#34d399"
                      stroke="rgba(15,23,42,0.55)"
                      strokeWidth={1}
                    />
                  </g>
                ))
              : null}

            {layers.pois
              ? pois.map((poi) => {
                  if (!isNorm(poi.mapX) || !isNorm(poi.mapY)) return null;
                  const selected = selectedPoiId === poi.id;
                  return (
                    <g key={poi.id}>
                      <circle
                        cx={poi.mapX * width}
                        cy={poi.mapY * height}
                        r={selected ? 6 : 5}
                        fill={poi.color ?? "#f59e0b"}
                        stroke="rgba(15,23,42,0.55)"
                        strokeWidth={selected ? 2 : 1}
                      />
                    </g>
                  );
                })
              : null}

            {showPingMarkers
              ? sessionPings.map((ping) => (
                  <g key={ping.id}>
                    <circle
                      cx={ping.mapX * width}
                      cy={ping.mapY * height}
                      r={ping.kind === "call" ? 7 : ping.kind === "pick" ? 6 : 5}
                      fill={
                        ping.kind === "call"
                          ? "#f59e0b"
                          : ping.kind === "pick"
                            ? "#34d399"
                            : "#0ea5e9"
                      }
                      stroke="rgba(15,23,42,0.6)"
                      strokeWidth={1}
                    />
                  </g>
                ))
              : null}

            {layers.labels
              ? labels.map((label) => (
                  <g key={label.id}>
                    <circle
                      cx={label.xNorm! * width}
                      cy={label.yNorm! * height}
                      r={2.5}
                      fill="rgba(248,250,252,0.92)"
                    />
                    <text
                      x={label.xNorm! * width + 6}
                      y={label.yNorm! * height - 2}
                      fontSize={11}
                      fill="#f8fafc"
                      stroke="rgba(15,23,42,0.85)"
                      strokeWidth={0.6}
                    >
                      {label.name}
                    </text>
                  </g>
                ))
              : null}

            {tool === "draw_zone" && zoneDraft.length > 0 ? (
              <>
                {zonePreviewPolygon(width, height) ? (
                  <polyline
                    points={zonePreviewPolygon(width, height)!}
                    fill="none"
                    stroke="rgba(59,130,246,0.95)"
                    strokeWidth={2}
                  />
                ) : null}
                {zoneDraft.length >= 3 ? (
                  <polygon
                    points={`${zonePreviewPolygon(width, height)} ${zoneDraft[0]!.x * width},${zoneDraft[0]!.y * height}`}
                    fill="rgba(59,130,246,0.16)"
                    stroke="rgba(59,130,246,0.7)"
                    strokeWidth={1}
                  />
                ) : null}
                {zoneDraft.map((point, idx) => (
                  <circle
                    key={`${point.x}-${point.y}-${idx}`}
                    cx={point.x * width}
                    cy={point.y * height}
                    r={idx === 0 ? 5 : 4}
                    fill={idx === 0 ? "#ffffff" : "#60a5fa"}
                    stroke="rgba(15,23,42,0.65)"
                    strokeWidth={1}
                  />
                ))}
              </>
            ) : null}
          </g>
        )}
      />

      {showControls ? (
        <MapOverlayToolkit
          storageKey={`map:${scope}:${communityId}:toolkit`}
          title="Map Overlay Toolkit"
          canManageLayers={canManageLayers}
          tool={tool}
          onToolChange={(next) => {
            setTool(next);
            if (next !== "draw_zone") {
              setZoneDraft([]);
              setZoneDraftState("idle");
            }
          }}
          layerState={layersForToolkit}
          pings={toolkitPings}
          onToggleLayer={(key, checked) => {
            if (key === "pings") {
              setShowPingMarkers(checked);
              return;
            }
            if (key === "grid") {
              setLayers((prev) => ({ ...prev, postalGrid: checked }));
              return;
            }
            if (key === "labels") {
              setLayers((prev) => ({ ...prev, labels: checked }));
              return;
            }
            if (key === "calls" || key === "units" || key === "pois" || key === "zones") {
              setLayers((prev) => ({ ...prev, [key]: checked }));
            }
          }}
          onClearPings={() => setSessionPings([])}
          onRemovePing={(id) => setSessionPings((prev) => prev.filter((ping) => ping.id !== id))}
          onSavePingAsPoi={
            canManageLayers
              ? (id) => {
                  const ping = sessionPings.find((entry) => entry.id === id);
                  if (!ping) return;
                  setPoiModalMode("create");
                  setPoiModalPoint({ mapX: ping.mapX, mapY: ping.mapY });
                  setPoiModalOpen(true);
                }
              : undefined
          }
        />
      ) : null}

      {tool === "draw_zone" ? (
        <div className="absolute bottom-3 left-3 z-20 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/94 p-2 shadow-[var(--panel-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
            Draw Zone - {zoneDraftState}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setZoneDraft((prev) => {
                  const next = prev.slice(0, Math.max(0, prev.length - 1));
                  if (next.length === 0) setZoneDraftState("idle");
                  else if (next.length >= 3) setZoneDraftState("ready_to_close");
                  else setZoneDraftState("drawing");
                  return next;
                });
              }}
              disabled={zoneDraft.length === 0}
            >
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setZoneDraft([]);
                setZoneDraftState("cancelled");
                setTool("none");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const geojson = makeZoneGeojson(zoneDraft);
                if (!geojson) return;
                setPendingZoneGeojson(geojson);
                setZoneModalMode("create");
                setZoneModalOpen(true);
                setZoneDraft([]);
                setZoneDraftState("completed");
                setTool("none");
              }}
              disabled={zoneDraft.length < 3}
            >
              Finish
            </Button>
          </div>
        </div>
      ) : null}

      {unmappedPois > 0 || unmappedZones > 0 ? (
        <div className="absolute left-3 top-3 z-10 rounded-[var(--radius-control)] border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-100">
          {unmappedPois > 0 ? `${unmappedPois} POI(s) need map placement. ` : ""}
          {unmappedZones > 0 ? `${unmappedZones} zone(s) use legacy coordinates.` : ""}
        </div>
      ) : null}

      {selectedPoi ? (
        <div className="absolute bottom-3 right-3 z-20 w-[290px] rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 p-2 shadow-[var(--panel-shadow)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[color:var(--text-main)]">
                <MapPinned className="mr-1 inline h-3.5 w-3.5 text-[color:var(--text-muted)]" />
                {selectedPoi.name}
              </p>
              <p className="text-[11px] text-[color:var(--text-muted)]">{selectedPoi.category}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedPoiId(null)}
              aria-label="Close POI"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {canManageLayers ? (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPoiModalMode("edit");
                  setPoiModalPoint({
                    mapX: selectedPoi.mapX ?? 0.5,
                    mapY: selectedPoi.mapY ?? 0.5,
                  });
                  setPoiModalOpen(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={deleteSelectedPoi}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Hide
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedZone ? (
        <div className="absolute bottom-3 right-3 z-20 w-[290px] rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 p-2 shadow-[var(--panel-shadow)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[color:var(--text-main)]">
                {selectedZone.name}
              </p>
              <p className="text-[11px] text-[color:var(--text-muted)]">{selectedZone.zoneType}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedZoneId(null)}
              aria-label="Close zone"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {canManageLayers ? (
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoneModalMode("edit");
                  setPendingZoneGeojson(null);
                  setZoneModalOpen(true);
                }}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={deleteSelectedZone}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Hide
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <AddPOIModal
        open={poiModalOpen}
        onOpenChange={setPoiModalOpen}
        mode={poiModalMode}
        poi={poiModalMode === "edit" ? selectedPoi : null}
        mapX={poiModalPoint.mapX}
        mapY={poiModalPoint.mapY}
        onSaved={reloadLayers}
      />
      <AddZoneModal
        open={zoneModalOpen}
        onOpenChange={setZoneModalOpen}
        mode={zoneModalMode}
        zone={zoneModalMode === "edit" ? selectedZone : null}
        geojson={pendingZoneGeojson}
        onSaved={reloadLayers}
      />

      {!mapReady ? (
        <div className="absolute inset-0 grid place-items-center">
          <p className="text-[13px] text-[color:var(--text-muted)]">Loading map...</p>
        </div>
      ) : null}
    </div>
  );
}

function priorityColor(priority: number) {
  if (priority <= 1) return "#30D158";
  if (priority === 2) return "#64D2FF";
  if (priority === 3) return "#0A84FF";
  if (priority === 4) return "#FF9F0A";
  return "#FF453A";
}

function renderGrid(width: number, height: number) {
  const cols = 12;
  const rows = 8;
  const lines: React.ReactNode[] = [];
  for (let col = 0; col <= cols; col += 1) {
    const x = (col / cols) * width;
    lines.push(
      <line
        key={`v-${col}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(248,250,252,0.25)"
        strokeWidth={1}
      />,
    );
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = (row / rows) * height;
    lines.push(
      <line
        key={`h-${row}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(248,250,252,0.25)"
        strokeWidth={1}
      />,
    );
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cx = ((col + 0.5) / cols) * width;
      const cy = ((row + 0.5) / rows) * height;
      lines.push(
        <text
          key={`label-${row}-${col}`}
          x={cx}
          y={cy}
          fontSize={10}
          textAnchor="middle"
          fill="rgba(248,250,252,0.75)"
          stroke="rgba(15,23,42,0.8)"
          strokeWidth={0.5}
        >
          {`${String.fromCharCode(65 + row)}${String(col + 1).padStart(2, "0")}`}
        </text>,
      );
    }
  }
  return <g>{lines}</g>;
}

function zoneHasNormalizedGeometry(geojson: any) {
  return Boolean(zonePolygonRing(geojson));
}

function zonePolygonRing(geojson: any): Array<{ x: number; y: number }> | null {
  if (!geojson || typeof geojson !== "object") return null;
  if (geojson.type !== "Polygon" || !Array.isArray(geojson.coordinates)) return null;
  const ring = geojson.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const points = ring
    .map(toNormPoint)
    .filter((point): point is { x: number; y: number } => Boolean(point));
  if (points.length < 4) return null;
  return points;
}
