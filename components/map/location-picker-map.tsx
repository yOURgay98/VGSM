"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export function LocationPickerMap({
  value,
  onPick,
  className,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (val: { lat: number; lng: number }) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      if (!containerRef.current) return;
      const maplibre = await import("maplibre-gl");

      const map = new maplibre.Map({
        container: containerRef.current,
        style: "/map/style.json",
        center: value ? [value.lng, value.lat] : [-95.7129, 37.0902],
        zoom: value ? 11 : 3,
        dragRotate: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!mounted) return;

        map.addSource("ess-location-picker", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: value
              ? [
                  {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [value.lng, value.lat] },
                    properties: {},
                  },
                ]
              : [],
          },
        });

        map.addLayer({
          id: "ess-location-picker-dot",
          type: "circle",
          source: "ess-location-picker",
          paint: {
            "circle-radius": 7,
            "circle-color": "rgba(10, 132, 255, 0.92)",
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1,
          },
        });

        map.on("click", (e: any) => {
          const lng = e?.lngLat?.lng;
          const lat = e?.lngLat?.lat;
          if (typeof lng !== "number" || typeof lat !== "number") return;
          onPick({ lat, lng });
        });
      });
    };

    void boot();

    return () => {
      mounted = false;
      try {
        mapRef.current?.remove();
      } catch {
        // Ignore.
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const src = map.getSource("ess-location-picker");
      if (!src || typeof src.setData !== "function") return;
      const fc = {
        type: "FeatureCollection",
        features: value
          ? [
              {
                type: "Feature",
                geometry: { type: "Point", coordinates: [value.lng, value.lat] },
                properties: {},
              },
            ]
          : [],
      };
      src.setData(fc as any);
      if (value) {
        map.easeTo({
          center: [value.lng, value.lat],
          zoom: Math.max(map.getZoom(), 11),
          duration: 180,
        });
      }
    } catch {
      // Ignore.
    }
  }, [value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)]",
        className,
      )}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
