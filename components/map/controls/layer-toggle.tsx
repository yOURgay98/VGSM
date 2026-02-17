"use client";

import { Layers } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { MapLayerState } from "@/lib/validations/map";

export function LayerToggle({
  value,
  onChange,
  className,
}: {
  value: MapLayerState;
  onChange: (next: MapLayerState) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/90 p-2 shadow-[var(--panel-shadow)] backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-[color:var(--text-muted)]" />
        <p className="text-[12px] font-semibold text-[color:var(--text-main)]">Layers</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        <ToggleRow
          label="Calls"
          checked={value.calls}
          onCheckedChange={(checked) => onChange({ ...value, calls: checked })}
        />
        <ToggleRow
          label="Units"
          checked={value.units}
          onCheckedChange={(checked) => onChange({ ...value, units: checked })}
        />
        <ToggleRow
          label="POIs"
          checked={value.pois}
          onCheckedChange={(checked) => onChange({ ...value, pois: checked })}
        />
        <ToggleRow
          label="Zones"
          checked={value.zones}
          onCheckedChange={(checked) => onChange({ ...value, zones: checked })}
        />
        <ToggleRow
          label="Heatmap"
          checked={value.heatmap}
          onCheckedChange={(checked) => onChange({ ...value, heatmap: checked })}
        />
        <ToggleRow
          label="Labels"
          checked={value.labels}
          onCheckedChange={(checked) => onChange({ ...value, labels: checked })}
        />
        <ToggleRow
          label="Postal grid"
          checked={value.postalGrid}
          onCheckedChange={(checked) => onChange({ ...value, postalGrid: checked })}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[color:var(--text-main)]">
      <Checkbox checked={checked} onCheckedChange={(val) => onCheckedChange(Boolean(val))} />
      <span className="leading-none">{label}</span>
    </label>
  );
}
