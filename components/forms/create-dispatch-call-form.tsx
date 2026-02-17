"use client";

import { useActionState } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bug, Crosshair, MapPin } from "lucide-react";

import { createDispatchCallAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState = {
  success: false,
  message: "",
  id: undefined as string | undefined,
  code: undefined as string | undefined,
};

export function CreateDispatchCallForm({ onCreated }: { onCreated?: (id: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV !== "production";

  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [mapX, setMapX] = useState("");
  const [mapY, setMapY] = useState("");
  const [description, setDescription] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [clientError, setClientError] = useState("");
  const [pickerStatus, setPickerStatus] = useState("");

  const selectedCoords = useMemo(() => {
    const x = Number(mapX);
    const y = Number(mapY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { mapX: x, mapY: y };
  }, [mapX, mapY]);

  const normalizedValidation = useMemo(() => {
    const xText = mapX.trim();
    const yText = mapY.trim();
    const hasX = xText.length > 0;
    const hasY = yText.length > 0;

    if (hasX !== hasY) {
      return "Map X and Map Y must both be provided.";
    }

    if (hasX && hasY) {
      const xN = Number(xText);
      const yN = Number(yText);
      if (!Number.isFinite(xN) || xN < 0 || xN > 1) return "Map X must be between 0 and 1.";
      if (!Number.isFinite(yN) || yN < 0 || yN > 1) return "Map Y must be between 0 and 1.";
      return "";
    }

    if (!locationName.trim()) {
      return "Location is required unless coordinates are set.";
    }

    return "";
  }, [locationName, mapX, mapY]);

  const [state, action, pending] = useActionState(
    async (prev: typeof initialState, formData: FormData) => {
      const res = await createDispatchCallAction(prev as any, formData);
      if (res.success && res.id) {
        const params = new URLSearchParams(searchParams);
        params.set("callId", res.id);
        params.delete("cursor");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        onCreated?.(res.id);
        setClientError("");
      }
      return res as any;
    },
    initialState,
  );

  useEffect(() => {
    const onPicked = (event: Event) => {
      const detail = (event as CustomEvent<{ mapX?: number; mapY?: number; text?: string }>).detail;
      if (!detail) return;
      if (typeof detail.mapX === "number" && typeof detail.mapY === "number") {
        setMapX(detail.mapX.toFixed(6));
        setMapY(detail.mapY.toFixed(6));
        if (!locationName.trim()) setLocationName("Picked on operational map");
        setPickerStatus(
          `Picked ${detail.text ?? `${detail.mapX.toFixed(6)}, ${detail.mapY.toFixed(6)}`}`,
        );
      }
    };
    window.addEventListener("vsm:map-toolkit:call-location-picked", onPicked as EventListener);
    return () =>
      window.removeEventListener("vsm:map-toolkit:call-location-picked", onPicked as EventListener);
  }, [locationName]);

  const statusText = clientError || state.message || pickerStatus;
  const statusTone = clientError
    ? "text-rose-600"
    : state.success && state.message
      ? "text-emerald-600"
      : "text-[color:var(--text-muted)]";

  return (
    <form
      action={action}
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        if (normalizedValidation) {
          event.preventDefault();
          setClientError(normalizedValidation);
          return;
        }
        setClientError("");
      }}
    >
      <div className="sm:col-span-2">
        <Label htmlFor="dispatch-title">Title</Label>
        <Input
          id="dispatch-title"
          name="title"
          required
          placeholder="Traffic stop at..."
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="dispatch-priority">Priority</Label>
        <select
          id="dispatch-priority"
          name="priority"
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
          defaultValue="3"
        >
          <option value="1">1 (Critical)</option>
          <option value="2">2 (High)</option>
          <option value="3">3 (Normal)</option>
          <option value="4">4 (Low)</option>
          <option value="5">5 (Info)</option>
        </select>
      </div>

      <div>
        <Label htmlFor="dispatch-location">Location</Label>
        <Input
          id="dispatch-location"
          name="locationName"
          placeholder="Required unless using coordinates"
          className="mt-1"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="dispatch-mapx">Map X</Label>
        <Input
          id="dispatch-mapx"
          name="mapX"
          placeholder="0.000000"
          className="mt-1"
          value={mapX}
          onChange={(e) => setMapX(e.target.value)}
          inputMode="decimal"
        />
      </div>

      <div>
        <Label htmlFor="dispatch-mapy">Map Y</Label>
        <Input
          id="dispatch-mapy"
          name="mapY"
          placeholder="0.000000"
          className="mt-1"
          value={mapY}
          onChange={(e) => setMapY(e.target.value)}
          inputMode="decimal"
        />
      </div>
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />

      <div className="sm:col-span-2">
        <Label htmlFor="dispatch-description">Description (optional)</Label>
        <Textarea
          id="dispatch-description"
          name="description"
          placeholder="Call details (optional)"
          className="mt-1 min-h-[110px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          data-tour="dispatch-pick-location"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("vsm:map-toolkit:start-call-picker"));
            setPickerStatus("Click on the map to set call location.");
          }}
        >
          <Crosshair className="mr-1 h-4 w-4" />
          Pick on map
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setMapX("");
            setMapY("");
            setPickerStatus("");
          }}
          disabled={!mapX && !mapY}
        >
          Clear coordinates
        </Button>
        <Button
          type="button"
          variant="outline"
          data-tour="dispatch-ping-call"
          onClick={() => {
            if (!selectedCoords) {
              setPickerStatus("Set coordinates first.");
              return;
            }
            window.dispatchEvent(
              new CustomEvent("vsm:map-toolkit:ping-coordinate", {
                detail: {
                  mapX: selectedCoords.mapX,
                  mapY: selectedCoords.mapY,
                  label: "Draft Call",
                },
              }),
            );
            setPickerStatus("Draft call location pinged.");
          }}
          disabled={!selectedCoords}
        >
          <MapPin className="mr-1 h-4 w-4" />
          Ping this call
        </Button>
        {isDev ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDebug((v) => !v)}
            aria-pressed={showDebug}
          >
            <Bug className="mr-1 h-4 w-4" />
            Debug
          </Button>
        ) : null}
      </div>

      {isDev && showDebug ? (
        <div className="sm:col-span-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-[12px] text-[color:var(--text-muted)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Debug
          </p>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                payload: {
                  title: "(from input)",
                  priority: "(from input)",
                  locationName,
                  mapX,
                  mapY,
                  description,
                },
                response: state,
              },
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}

      <div className="sm:col-span-2 flex items-center justify-between">
        <p role="status" aria-live="polite" className={`min-h-4 text-xs ${statusTone}`}>
          {statusText}
        </p>
        <Button type="submit" variant="primary" disabled={pending || Boolean(normalizedValidation)}>
          {pending ? "Saving..." : "Create Call"}
        </Button>
      </div>
    </form>
  );
}
