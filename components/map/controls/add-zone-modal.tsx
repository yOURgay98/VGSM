"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Zone = {
  id: string;
  name: string;
  zoneType: string;
  geojson: any;
  color: string | null;
};

export function AddZoneModal({
  open,
  onOpenChange,
  mode,
  zone,
  geojson,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  zone?: Zone | null;
  geojson: any | null;
  onSaved: () => void;
}) {
  const title = useMemo(() => (mode === "edit" ? "Edit Zone" : "Add Zone"), [mode]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState("patrol");
  const [color, setColor] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && zone) {
      setName(zone.name);
      setZoneType(zone.zoneType || "patrol");
      setColor(zone.color ?? "");
    } else {
      setName("");
      setZoneType("patrol");
      setColor("");
    }
  }, [mode, open, zone]);

  async function onSubmit() {
    if (mode === "create" && !geojson) {
      setError("Missing polygon geometry.");
      return;
    }

    const payload = {
      name,
      zoneType,
      color: color.trim() ? color.trim() : null,
      ...(geojson ? { geojson } : {}),
    };

    setSaving(true);
    setError(null);
    try {
      const res =
        mode === "edit" && zone
          ? await fetch(`/api/map/zones/${encodeURIComponent(zone.id)}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/map/zones", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });

      const json = (await res.json()) as any;
      if (!res.ok || json?.ok === false) {
        const apiMessage =
          typeof json?.error === "string"
            ? json.error
            : typeof json?.error?.message === "string"
              ? json.error.message
              : "Failed to save zone.";
        setError(apiMessage);
        return;
      }

      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save zone.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <div className="space-y-3">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="text-xs">
              Zones are shared within the active community.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-[var(--radius-control)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
              {error}
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
              <span className="text-xs font-medium text-[color:var(--text-muted)]">Name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Patrol Sector A"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">Type</span>
                <Input
                  value={zoneType}
                  onChange={(e) => setZoneType(e.target.value)}
                  placeholder="patrol"
                />
              </label>
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                  Color (hex)
                </span>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#0A84FF"
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} disabled={saving || name.trim().length < 2}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
