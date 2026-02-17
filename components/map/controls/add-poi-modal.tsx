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
import { Textarea } from "@/components/ui/textarea";

type Poi = {
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

export function AddPOIModal({
  open,
  onOpenChange,
  mode,
  poi,
  mapX,
  mapY,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  poi?: Poi | null;
  mapX: number;
  mapY: number;
  onSaved: () => void;
}) {
  const title = useMemo(() => (mode === "edit" ? "Edit POI" : "Add POI"), [mode]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && poi) {
      setName(poi.name);
      setCategory(poi.category || "general");
      setDescription(poi.description ?? "");
      setColor(poi.color ?? "");
      setIcon(poi.icon ?? "");
    } else {
      setName("");
      setCategory("general");
      setDescription("");
      setColor("");
      setIcon("");
    }
  }, [mode, open, poi]);

  async function onSubmit() {
    const payload = {
      name,
      category,
      description: description.trim() ? description.trim() : null,
      mapX,
      mapY,
      color: color.trim() ? color.trim() : null,
      icon: icon.trim() ? icon.trim() : null,
    };

    setSaving(true);
    setError(null);
    try {
      const res =
        mode === "edit" && poi
          ? await fetch(`/api/map/pois/${encodeURIComponent(poi.id)}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch("/api/map/pois", {
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
              : "Failed to save POI.";
        setError(apiMessage);
        return;
      }

      onOpenChange(false);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save POI.");
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
              Points of Interest are shared within the active community.
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
                placeholder="e.g. PD HQ"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">Category</span>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="general"
                />
              </label>
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">
                  Color (hex)
                </span>
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#6B7280"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">Map X</span>
                <Input value={mapX.toFixed(6)} readOnly />
              </label>
              <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
                <span className="text-xs font-medium text-[color:var(--text-muted)]">Map Y</span>
                <Input value={mapY.toFixed(6)} readOnly />
              </label>
            </div>

            <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
              <span className="text-xs font-medium text-[color:var(--text-muted)]">
                Icon (optional)
              </span>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="lucide icon key (optional)"
              />
            </label>

            <label className="grid gap-1 text-[13px] text-[color:var(--text-main)]">
              <span className="text-xs font-medium text-[color:var(--text-muted)]">
                Description
              </span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes..."
                className="min-h-[84px]"
              />
            </label>
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
