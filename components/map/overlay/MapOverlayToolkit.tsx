"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Ellipsis,
  Grid2X2,
  Layers3,
  MapPin,
  MapPinned,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Radar,
  Target,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalStorageState } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export type OverlayTool = "none" | "ping" | "pick_call_location" | "add_poi" | "draw_zone";

export type OverlayLayerState = {
  pings: boolean;
  grid: boolean;
  calls: boolean;
  units: boolean;
  pois: boolean;
  zones: boolean;
  labels?: boolean;
};

export type SessionPing = {
  id: string;
  label: string;
  canSaveAsPoi?: boolean;
};

type DockMode = "left" | "right" | "floating";

type ToolkitLayout = {
  dockMode: DockMode;
  x: number;
  y: number;
  open: boolean;
  sections: {
    tools: boolean;
    layers: boolean;
    pings: boolean;
  };
};

const DEFAULT_LAYOUT: ToolkitLayout = {
  dockMode: "right",
  x: 24,
  y: 24,
  open: true,
  sections: {
    tools: true,
    layers: true,
    pings: true,
  },
};

const TOOL_LABEL: Record<OverlayTool, string> = {
  none: "None",
  ping: "Ping",
  pick_call_location: "Pick Call",
  add_poi: "Add POI",
  draw_zone: "Draw Zone",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function MapOverlayToolkit({
  storageKey,
  title,
  canManageLayers,
  tool,
  onToolChange,
  layerState,
  pings,
  onToggleLayer,
  onClearPings,
  onRemovePing,
  onSavePingAsPoi,
}: {
  storageKey: string;
  title: string;
  canManageLayers: boolean;
  tool: OverlayTool;
  onToolChange: (tool: OverlayTool) => void;
  layerState: OverlayLayerState;
  pings: SessionPing[];
  onToggleLayer: (key: keyof OverlayLayerState, checked: boolean) => void;
  onClearPings: () => void;
  onRemovePing: (id: string) => void;
  onSavePingAsPoi?: (id: string) => void;
}) {
  const [layout, setLayout] = useLocalStorageState<ToolkitLayout>(
    `${storageKey}:layout.v1`,
    DEFAULT_LAYOUT,
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    if (layout.dockMode !== "floating") return;

    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag?.active) return;
      const panel = panelRef.current;
      if (!panel) return;

      const width = panel.offsetWidth || 320;
      const height = panel.offsetHeight || 420;

      const nextX = drag.originX + (event.clientX - drag.startX);
      const nextY = drag.originY + (event.clientY - drag.startY);

      setLayout((prev) => ({
        ...prev,
        x: clamp(nextX, 8, Math.max(8, window.innerWidth - width - 8)),
        y: clamp(nextY, 8, Math.max(8, window.innerHeight - height - 8)),
      }));
    };

    const onUp = () => {
      if (dragRef.current) {
        dragRef.current.active = false;
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [layout.dockMode, setLayout]);

  const rootClass = useMemo(() => {
    if (layout.dockMode === "left") {
      return "left-3 top-3";
    }
    if (layout.dockMode === "right") {
      return "right-3 top-3";
    }
    return "";
  }, [layout.dockMode]);

  const rootStyle =
    layout.dockMode === "floating"
      ? ({
          left: `${layout.x}px`,
          top: `${layout.y}px`,
        } as CSSProperties)
      : undefined;

  return (
    <div
      data-tour="map-toolkit"
      className={cn("pointer-events-auto absolute z-20 w-[320px]", rootClass)}
      style={rootStyle}
    >
      <div
        ref={panelRef}
        className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/94 shadow-[var(--panel-shadow)] backdrop-blur"
      >
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b border-[color:var(--border)] px-2 py-1.5",
            layout.dockMode === "floating" ? "cursor-move" : "",
          )}
          onPointerDown={(event) => {
            if (layout.dockMode !== "floating") return;
            if (event.button !== 0) return;
            const target = event.target as HTMLElement | null;
            if (target?.closest("button,[role='menuitem']")) return;
            dragRef.current = {
              active: true,
              startX: event.clientX,
              startY: event.clientY,
              originX: layout.x,
              originY: layout.y,
            };
          }}
        >
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              {title}
            </p>
            <p className="truncate text-[11px] text-[color:var(--text-muted)]">
              Active tool: {TOOL_LABEL[tool]}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Map toolkit layout options">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setLayout((prev) => ({ ...prev, dockMode: "left" }))}
                >
                  Dock Left
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLayout((prev) => ({ ...prev, dockMode: "right" }))}
                >
                  Dock Right
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLayout((prev) => ({ ...prev, dockMode: "floating" }))}
                >
                  Float
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLayout(DEFAULT_LAYOUT)}>
                  Reset Position
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLayout((prev) => ({ ...prev, open: !prev.open }))}
              aria-label={
                layout.open ? "Collapse map overlay toolkit" : "Expand map overlay toolkit"
              }
            >
              {layout.open ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {layout.open ? (
          <div className="space-y-2 p-2">
            <section className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
              <SectionHeader
                title="Tools"
                open={layout.sections.tools}
                onToggle={() =>
                  setLayout((prev) => ({
                    ...prev,
                    sections: { ...prev.sections, tools: !prev.sections.tools },
                  }))
                }
              />
              {layout.sections.tools ? (
                <div className="mt-1.5 grid gap-1.5">
                  <Button
                    size="sm"
                    variant={tool === "ping" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => onToolChange(tool === "ping" ? "none" : "ping")}
                  >
                    <MapPin className="mr-1.5 h-3.5 w-3.5" />
                    Ping Tool
                  </Button>
                  <Button
                    size="sm"
                    variant={tool === "pick_call_location" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() =>
                      onToolChange(tool === "pick_call_location" ? "none" : "pick_call_location")
                    }
                  >
                    <Target className="mr-1.5 h-3.5 w-3.5" />
                    Call Picker
                  </Button>
                  {canManageLayers ? (
                    <>
                      <Button
                        size="sm"
                        variant={tool === "add_poi" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => onToolChange(tool === "add_poi" ? "none" : "add_poi")}
                      >
                        <MapPinned className="mr-1.5 h-3.5 w-3.5" />
                        Add POI
                      </Button>
                      <Button
                        size="sm"
                        variant={tool === "draw_zone" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => onToolChange(tool === "draw_zone" ? "none" : "draw_zone")}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Draw Zone
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
              <SectionHeader
                title="Layers"
                open={layout.sections.layers}
                onToggle={() =>
                  setLayout((prev) => ({
                    ...prev,
                    sections: { ...prev.sections, layers: !prev.sections.layers },
                  }))
                }
              />
              {layout.sections.layers ? (
                <div className="mt-1.5 grid gap-1">
                  <LayerRow
                    icon={<Radar className="h-3.5 w-3.5" />}
                    label="Calls"
                    checked={layerState.calls}
                    onCheckedChange={(checked) => onToggleLayer("calls", checked)}
                  />
                  <LayerRow
                    icon={<Target className="h-3.5 w-3.5" />}
                    label="Units"
                    checked={layerState.units}
                    onCheckedChange={(checked) => onToggleLayer("units", checked)}
                  />
                  <LayerRow
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Pings"
                    checked={layerState.pings}
                    onCheckedChange={(checked) => onToggleLayer("pings", checked)}
                  />
                  <LayerRow
                    icon={<Grid2X2 className="h-3.5 w-3.5" />}
                    label="Grid / Postals"
                    checked={layerState.grid}
                    onCheckedChange={(checked) => onToggleLayer("grid", checked)}
                  />
                  <LayerRow
                    icon={<Layers3 className="h-3.5 w-3.5" />}
                    label="Labels"
                    checked={layerState.labels !== false}
                    onCheckedChange={(checked) => onToggleLayer("labels", checked)}
                  />
                  <LayerRow
                    icon={<MapPinned className="h-3.5 w-3.5" />}
                    label="POIs"
                    checked={layerState.pois}
                    onCheckedChange={(checked) => onToggleLayer("pois", checked)}
                  />
                  <LayerRow
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    label="Zones"
                    checked={layerState.zones}
                    onCheckedChange={(checked) => onToggleLayer("zones", checked)}
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
              <SectionHeader
                title={`Pings (${pings.length})`}
                open={layout.sections.pings}
                onToggle={() =>
                  setLayout((prev) => ({
                    ...prev,
                    sections: { ...prev.sections, pings: !prev.sections.pings },
                  }))
                }
              />
              {layout.sections.pings ? (
                <div className="mt-1.5 space-y-1.5">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onClearPings}
                      disabled={pings.length === 0}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Clear all
                    </Button>
                  </div>
                  <div className="max-h-28 overflow-auto rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-1">
                    {pings.length === 0 ? (
                      <p className="px-1 py-1 text-[11px] text-[color:var(--text-muted)]">
                        No pings in this session.
                      </p>
                    ) : (
                      pings.map((ping) => (
                        <div
                          key={ping.id}
                          className="flex items-center justify-between gap-2 rounded px-1 py-1 text-[11px]"
                        >
                          <span className="truncate text-[color:var(--text-main)]">
                            {ping.label}
                          </span>
                          <div className="flex items-center gap-1">
                            {canManageLayers && onSavePingAsPoi ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => onSavePingAsPoi(ping.id)}
                                aria-label={`Save ping ${ping.label} as POI`}
                              >
                                <MapPinned className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => onRemovePing(ping.id)}
                              aria-label={`Remove ping ${ping.label}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
        {title}
      </span>
      <span className="text-[11px] text-[color:var(--text-muted)]">{open ? "-" : "+"}</span>
    </button>
  );
}

function LayerRow({
  icon,
  label,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded px-1.5 py-1 text-[12px] text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]">
      <Checkbox checked={checked} onCheckedChange={(next) => onCheckedChange(Boolean(next))} />
      <span className="text-[color:var(--text-muted)]">{icon}</span>
      <span>{label}</span>
    </label>
  );
}
