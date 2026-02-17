"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CornerUpLeft, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LngLat = { lng: number; lat: number };

type DrawState = "idle" | "drawing" | "ready_to_finish";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: any;
    properties: Record<string, unknown>;
  }>;
};

const SNAP_PX = 14;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isValidLngLat(p: LngLat) {
  return (
    isFiniteNumber(p.lng) &&
    isFiniteNumber(p.lat) &&
    p.lng >= -180 &&
    p.lng <= 180 &&
    p.lat >= -90 &&
    p.lat <= 90
  );
}

function toPolygon(points: LngLat[]) {
  const ring = points.map((p) => [p.lng, p.lat]);
  if (ring.length > 0) ring.push(ring[0]); // close
  return { type: "Polygon", coordinates: [ring] };
}

function validatePolygon(points: LngLat[]) {
  if (points.length < 3) return { ok: false as const, error: "Add at least 3 points." };
  if (!points.every(isValidLngLat))
    return { ok: false as const, error: "Invalid coordinates (out of bounds or NaN)." };

  const poly = toPolygon(points);
  const ring = poly.coordinates?.[0] as Array<[number, number]> | undefined;
  if (!ring || ring.length < 4) return { ok: false as const, error: "Polygon ring is incomplete." };

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
    return { ok: false as const, error: "Polygon must be closed." };
  }

  return { ok: true as const, geojson: poly };
}

function buildFeatureCollection(points: LngLat[], hover: LngLat | null): FeatureCollection {
  const features: FeatureCollection["features"] = [];

  // Vertices.
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {
        kind: "vertex",
        idx: i,
        isFirst: i === 0,
        isLast: i === points.length - 1,
      },
    });
  }

  // Preview line: last vertex -> cursor.
  const lineCoords: Array<[number, number]> = points.map((p) => [p.lng, p.lat]);
  if (hover && isValidLngLat(hover)) {
    lineCoords.push([hover.lng, hover.lat]);
  }
  if (lineCoords.length >= 2) {
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: lineCoords },
      properties: { kind: "line" },
    });
  }

  // Polygon preview (closed to the first point) once there are enough vertices.
  if (points.length >= 3) {
    features.push({
      type: "Feature",
      geometry: toPolygon(points),
      properties: { kind: "poly" },
    });
  }

  return { type: "FeatureCollection", features };
}

export function AddZoneMode({
  map,
  active,
  className,
  onCancel,
  onComplete,
}: {
  map: any | null;
  active: boolean;
  className?: string;
  onCancel: () => void;
  onComplete: (geojson: any) => void;
}) {
  const [points, setPoints] = useState<LngLat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pointsRef = useRef<LngLat[]>([]);
  const hoverRef = useRef<LngLat | null>(null);
  const rafRef = useRef<number | null>(null);

  const onCancelRef = useRef(onCancel);
  const onCompleteRef = useRef(onComplete);

  const canFinish = points.length >= 3;
  const state: DrawState = useMemo(() => {
    if (!active) return "idle";
    return canFinish ? "ready_to_finish" : "drawing";
  }, [active, canFinish]);

  function syncPreviewNow() {
    if (!map || !active) return;
    try {
      const src = map.getSource("ess-zone-draw");
      if (!src || typeof src.setData !== "function") return;
      src.setData(buildFeatureCollection(pointsRef.current, hoverRef.current) as any);
    } catch {
      // Ignore preview sync failures.
    }
  }

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      setPoints([]);
      pointsRef.current = [];
      hoverRef.current = null;
      setError(null);
      return;
    }
    setPoints([]);
    pointsRef.current = [];
    hoverRef.current = null;
    setError(null);
  }, [active]);

  useEffect(() => {
    if (!map || !active) return;

    const sourceId = "ess-zone-draw";
    const fillId = "ess-zone-draw-fill";
    const lineId = "ess-zone-draw-line";
    const ptsId = "ess-zone-draw-pts";
    const ptsHiId = "ess-zone-draw-pts-hi";

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(fillId)) {
      map.addLayer({
        id: fillId,
        type: "fill",
        source: sourceId,
        filter: ["==", ["get", "kind"], "poly"],
        paint: {
          "fill-color": "rgba(10, 132, 255, 0.18)",
          "fill-opacity": 0.22,
        },
      });
    }
    if (!map.getLayer(lineId)) {
      map.addLayer({
        id: lineId,
        type: "line",
        source: sourceId,
        filter: ["==", ["get", "kind"], "line"],
        paint: {
          "line-color": "rgba(10, 132, 255, 0.9)",
          "line-width": 2,
        },
      });
    }

    if (!map.getLayer(ptsId)) {
      map.addLayer({
        id: ptsId,
        type: "circle",
        source: sourceId,
        filter: ["==", ["get", "kind"], "vertex"],
        paint: {
          "circle-radius": 4,
          "circle-color": "rgba(10, 132, 255, 0.92)",
          "circle-stroke-color": "rgba(0,0,0,0.35)",
          "circle-stroke-width": 1,
        },
      });
    }

    if (!map.getLayer(ptsHiId)) {
      map.addLayer({
        id: ptsHiId,
        type: "circle",
        source: sourceId,
        filter: [
          "all",
          ["==", ["get", "kind"], "vertex"],
          ["any", ["==", ["get", "isFirst"], true], ["==", ["get", "isLast"], true]],
        ],
        paint: {
          "circle-radius": 6,
          "circle-color": "rgba(255,255,255,0.18)",
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 1,
        },
      });
    }

    const prevCursor = map.getCanvas().style.cursor;
    map.getCanvas().style.cursor = "crosshair";
    try {
      map.doubleClickZoom.disable();
    } catch {
      // Ignore.
    }

    const updateSource = () => {
      const src = map.getSource(sourceId);
      if (!src || typeof src.setData !== "function") return;
      const fc = buildFeatureCollection(pointsRef.current, hoverRef.current);
      src.setData(fc as any);
    };

    const scheduleSourceUpdate = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        updateSource();
      });
    };

    const finish = () => {
      const check = validatePolygon(pointsRef.current);
      if (!check.ok) {
        setError(check.error);
        return;
      }
      onCompleteRef.current(check.geojson);
    };

    const onClick = (e: any) => {
      // Clicking on the map while drawing should not trigger selection of underlying call/unit layers.
      if (e?.originalEvent?.stopPropagation) e.originalEvent.stopPropagation();

      const lng = e?.lngLat?.lng;
      const lat = e?.lngLat?.lat;
      if (typeof lng !== "number" || typeof lat !== "number") return;

      // Ignore the second click of a double-click, otherwise we add duplicate vertices right before finishing.
      const detail = (e?.originalEvent as MouseEvent | undefined)?.detail;
      if (typeof detail === "number" && detail >= 2) return;

      // Snap-to-close: when there are enough points, clicking near the first vertex finishes the zone.
      const first = pointsRef.current[0];
      if (
        first &&
        pointsRef.current.length >= 3 &&
        e?.point &&
        typeof e.point.x === "number" &&
        typeof e.point.y === "number"
      ) {
        try {
          const fp = map.project([first.lng, first.lat]);
          const dx = fp.x - e.point.x;
          const dy = fp.y - e.point.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= SNAP_PX) {
            finish();
            return;
          }
        } catch {
          // Ignore snap failures.
        }
      }

      const next = [...pointsRef.current, { lng, lat }];
      pointsRef.current = next;
      setPoints(next);
      setError(null);
      scheduleSourceUpdate();
    };

    const onDblClick = (e: any) => {
      if (pointsRef.current.length < 3) return;
      // Prevent zoom.
      if (e?.preventDefault) e.preventDefault();
      if (e?.originalEvent?.stopPropagation) e.originalEvent.stopPropagation();
      finish();
    };

    const onMove = (e: any) => {
      const lng = e?.lngLat?.lng;
      const lat = e?.lngLat?.lat;
      if (typeof lng !== "number" || typeof lat !== "number") return;
      hoverRef.current = { lng, lat };
      scheduleSourceUpdate();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (
        event.key === "Backspace" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        const next = pointsRef.current.slice(0, Math.max(0, pointsRef.current.length - 1));
        pointsRef.current = next;
        setPoints(next);
        setError(null);
        scheduleSourceUpdate();
      }
    };

    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    map.on("mousemove", onMove);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.off("mousemove", onMove);
      window.removeEventListener("keydown", onKeyDown);
      if (rafRef.current) {
        try {
          window.cancelAnimationFrame(rafRef.current);
        } catch {
          // Ignore.
        }
        rafRef.current = null;
      }
      try {
        map.doubleClickZoom.enable();
      } catch {
        // Ignore.
      }
      map.getCanvas().style.cursor = prevCursor;

      try {
        if (map.getLayer(ptsHiId)) map.removeLayer(ptsHiId);
        if (map.getLayer(ptsId)) map.removeLayer(ptsId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch {
        // Ignore.
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, map]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/90 p-2 shadow-[var(--panel-shadow)] backdrop-blur",
        className,
      )}
    >
      <p className="text-[12px] font-semibold text-[color:var(--text-main)]">Draw Zone</p>
      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
        Click to add points. Double-click (or Finish) to close the polygon.
      </p>

      {error ? (
        <div className="mt-2 rounded-[var(--radius-control)] border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-[12px] text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const next = pointsRef.current.slice(0, Math.max(0, pointsRef.current.length - 1));
            pointsRef.current = next;
            setPoints(next);
            setError(null);
            syncPreviewNow();
          }}
          disabled={points.length === 0}
        >
          <CornerUpLeft className="mr-1 h-3.5 w-3.5" />
          Undo
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            const check = validatePolygon(pointsRef.current);
            if (!check.ok) {
              setError(check.error);
              return;
            }
            onComplete(check.geojson);
          }}
          disabled={!canFinish}
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Finish
        </Button>
        <span className="ml-auto text-xs text-[color:var(--text-muted)]">
          {state === "ready_to_finish" ? "Ready" : "Drawing"} - {points.length} pts
        </span>
      </div>
    </div>
  );
}
