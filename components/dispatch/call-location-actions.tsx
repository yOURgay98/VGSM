"use client";

import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CallLocationActions({
  callId,
  title,
  mapX,
  mapY,
}: {
  callId: string;
  title: string;
  mapX: number | null;
  mapY: number | null;
}) {
  const [status, setStatus] = useState("");
  const coords =
    typeof mapX === "number" && typeof mapY === "number"
      ? `${mapX.toFixed(6)}, ${mapY.toFixed(6)}`
      : null;

  function pingLocation() {
    if (!coords) {
      setStatus("Call has no coordinates.");
      return;
    }
    window.dispatchEvent(
      new CustomEvent("vsm:map-toolkit:ping-coordinate", {
        detail: { callId, mapX, mapY, label: `Call: ${title}` },
      }),
    );
    setStatus("Ping dropped on map.");
  }

  async function copyCoords() {
    if (!coords) {
      setStatus("Call has no coordinates.");
      return;
    }
    try {
      await navigator.clipboard.writeText(coords);
      setStatus("Coordinates copied.");
    } catch {
      setStatus("Clipboard unavailable.");
    }
  }

  function startPicker() {
    window.dispatchEvent(new CustomEvent("vsm:map-toolkit:start-call-picker"));
    setStatus("Pick mode enabled on the operational map.");
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
        Location tools
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={pingLocation}>
          <MapPin className="mr-1 h-3.5 w-3.5" />
          Ping location
        </Button>
        <Button size="sm" variant="outline" onClick={copyCoords}>
          Copy coords
        </Button>
        <Button size="sm" variant="outline" onClick={startPicker}>
          <Crosshair className="mr-1 h-3.5 w-3.5" />
          Pick on map
        </Button>
      </div>
      <p className="min-h-4 text-xs text-[color:var(--text-muted)]">{status || " "}</p>
    </div>
  );
}
