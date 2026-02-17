"use client";

import { useMemo, useState } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/layout/theme-provider";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "gray", label: "Gray" },
];

const accentOptions = [
  { value: "blue", label: "Blue" },
  { value: "teal", label: "Teal" },
  { value: "graphite", label: "Graphite" },
  { value: "custom", label: "Custom" },
];

export function AppearanceSettings() {
  const { resolvedTheme, setTheme, accent, setAccent, customAccent, setCustomAccent } = useTheme();
  const [customDraft, setCustomDraft] = useState(customAccent ?? "");

  const customValid = useMemo(() => /^#?[0-9a-fA-F]{6}$/.test(customDraft.trim()), [customDraft]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[color:var(--text-main)]">Appearance</p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Theme and accent are stored locally (cookie + localStorage) for instant switching.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
            Theme
          </p>
          <div className="mt-2">
            <SegmentedControl
              ariaLabel="Theme"
              value={resolvedTheme}
              onChange={(v) => setTheme(v as any)}
              options={themeOptions}
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
            Accent
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SegmentedControl
              ariaLabel="Accent"
              value={accent}
              onChange={(v) => {
                setAccent(v as any);
                if (v !== "custom") {
                  setCustomAccent(null);
                } else {
                  const next = normalizeHex(customDraft);
                  setCustomAccent(next);
                }
              }}
              options={accentOptions}
            />
          </div>

          {accent === "custom" ? (
            <div className="mt-3">
              <Label htmlFor="customAccent">Custom accent (hex)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  id="customAccent"
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  placeholder="#0A84FF"
                />
                <button
                  type="button"
                  disabled={!customValid}
                  onClick={() => setCustomAccent(normalizeHex(customDraft))}
                  className={cn(
                    "ui-transition rounded-[var(--radius-control)] border px-3 py-1.5 text-[13px] font-medium",
                    customValid
                      ? "border-[color:var(--border)] bg-[color:var(--surface-strong)] text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] opacity-70",
                  )}
                >
                  Apply
                </button>
              </div>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Use a subtle color. If invalid, the accent falls back to the preset.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["light", "gray", "dark"] as const).map((t) => (
          <PreviewTile
            key={t}
            theme={t}
            accent={accent}
            customAccent={customAccent}
            active={resolvedTheme === t}
            onClick={() => setTheme(t)}
          />
        ))}
      </div>
    </div>
  );
}

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return trimmed.startsWith("#") ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`;
}

function PreviewTile({
  theme,
  accent,
  customAccent,
  active,
  onClick,
}: {
  theme: "light" | "dark" | "gray";
  accent: string;
  customAccent: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-theme={theme}
      data-accent={accent}
      style={
        accent === "custom" && customAccent ? ({ "--accent": customAccent } as any) : undefined
      }
      className={cn(
        "ui-transition glass-noise relative overflow-hidden rounded-[var(--radius-panel)] border p-3 text-left",
        active
          ? "border-[color:var(--border-strong)] shadow-[var(--window-shadow)]"
          : "border-[color:var(--border)]",
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 14% -8%, var(--bg-layer-a), transparent 42%), radial-gradient(circle at 92% -20%, var(--bg-layer-b), transparent 40%), var(--bg)",
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            {theme}
          </p>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
        </div>
        <div className="mt-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--window-shell)] shadow-[var(--panel-shadow)] backdrop-blur-lg">
          <div className="border-b border-[color:var(--border)] bg-[color:var(--titlebar-bg)] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
          </div>
          <div className="p-3">
            <div className="h-2.5 w-28 rounded-full bg-black/10 dark:bg-white/10" />
            <div className="mt-2 grid gap-2">
              <div className="h-7 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)]" />
              <div className="h-7 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)]" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
