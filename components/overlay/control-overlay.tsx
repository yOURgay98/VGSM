"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, Minus, X } from "lucide-react";

import { useOverlay } from "@/components/overlay/overlay-provider";
import { OverlayContent } from "@/components/overlay/overlay-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Bounds = { x: number; y: number; w: number; h: number };

const BOUNDS_KEY = "erlc.overlay.bounds.v1";

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function defaultBounds(mode: "compact" | "expanded"): Bounds {
  if (typeof window === "undefined") {
    return { x: 24, y: 84, w: mode === "expanded" ? 980 : 420, h: mode === "expanded" ? 640 : 360 };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const w = mode === "expanded" ? Math.min(980, Math.max(760, vw - 80)) : 420;
  const h = mode === "expanded" ? Math.min(640, Math.max(520, vh - 140)) : 360;
  const x = Math.max(16, vw - w - 16);
  const y = 72;

  return { x, y, w, h };
}

function readPersistedBounds(): Partial<Record<"compact" | "expanded", Bounds>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BOUNDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as any;
  } catch {
    return null;
  }
}

function persistBounds(mode: "compact" | "expanded", bounds: Bounds) {
  try {
    const next = readPersistedBounds() ?? {};
    (next as any)[mode] = bounds;
    window.localStorage.setItem(BOUNDS_KEY, JSON.stringify(next));
  } catch {
    // Ignore.
  }
}

export function ControlOverlay({ standalone = false }: { standalone?: boolean }) {
  const overlay = useOverlay();
  const open = standalone ? true : overlay.open;
  const minimized = standalone ? false : overlay.minimized;
  const mode = overlay.mode;

  const [mounted, setMounted] = useState(false);
  // Never read localStorage during SSR/initial render. We'll hydrate bounds after mount.
  const [bounds, setBounds] = useState<Bounds>(() => defaultBounds("compact"));

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const persisted = readPersistedBounds();
    setBounds(persisted?.[mode] ?? defaultBounds(mode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    persistBounds(mode, bounds);
  }, [bounds, mode, mounted]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (dragRef.current && event.pointerId === dragRef.current.pointerId) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nextX = dragRef.current.originX + (event.clientX - dragRef.current.startX);
        const nextY = dragRef.current.originY + (event.clientY - dragRef.current.startY);
        setBounds((prev) => ({
          ...prev,
          x: clamp(nextX, 8, Math.max(8, vw - prev.w - 8)),
          y: clamp(nextY, 8, Math.max(8, vh - prev.h - 8)),
        }));
        return;
      }
      if (resizeRef.current && event.pointerId === resizeRef.current.pointerId) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const nextW = resizeRef.current.originW + (event.clientX - resizeRef.current.startX);
        const nextH = resizeRef.current.originH + (event.clientY - resizeRef.current.startY);
        setBounds((prev) => ({
          ...prev,
          w: clamp(nextW, 360, Math.min(1240, vw - prev.x - 8)),
          h: clamp(nextH, 260, Math.min(920, vh - prev.y - 8)),
        }));
      }
    };

    const onUp = (event: PointerEvent) => {
      if (dragRef.current && event.pointerId === dragRef.current.pointerId) {
        dragRef.current = null;
      }
      if (resizeRef.current && event.pointerId === resizeRef.current.pointerId) {
        resizeRef.current = null;
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const controls = useMemo(
    () => [
      { label: "Close window", color: "#ff5f57", onClick: overlay.closeOverlay },
      { label: "Minimize window", color: "#febc2e", onClick: overlay.minimizeOverlay },
      { label: "Zoom window", color: "#28c840", onClick: overlay.toggleMode },
    ],
    [overlay],
  );

  // Render nothing until mounted so SSR and first client render match (prevents hydration warnings).
  if (!mounted) return null;
  if (!open) return null;

  if (minimized) {
    const node = (
      <button
        type="button"
        onClick={overlay.restoreOverlay}
        className="ui-transition fixed bottom-4 right-4 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] shadow-[var(--window-shadow)] hover:scale-[1.02]"
        aria-label="Restore control overlay"
      >
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
      </button>
    );
    return standalone ? node : createPortal(node, document.body);
  }

  const node = (
    <section
      className={cn(
        standalone
          ? "ui-transition relative mx-auto h-[min(820px,calc(100svh-140px))] min-h-[520px] w-full max-w-[1180px]"
          : "ui-transition fixed z-[100] select-none",
      )}
      style={
        standalone
          ? undefined
          : {
              left: bounds.x,
              top: bounds.y,
              width: bounds.w,
              height: bounds.h,
            }
      }
      aria-label="Control overlay window"
    >
      <div className="relative h-full overflow-hidden rounded-[18px] border border-[color:var(--border-strong)] bg-[color:var(--window-shell)] shadow-[var(--window-shadow)] backdrop-blur-xl">
        <div
          className="flex h-9 items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--titlebar-bg)] px-3"
          onPointerDown={(event) => {
            if (standalone) return;
            if (event.button !== 0) return;
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              originX: bounds.x,
              originY: bounds.y,
            };
          }}
        >
          <div aria-hidden className="flex items-center gap-1.5">
            {controls.map((control) => (
              <span
                key={control.label}
                className="ui-transition group relative h-3.5 w-3.5 rounded-full border border-black/20 hover:scale-105"
                style={{ backgroundColor: control.color }}
                onClick={(event) => {
                  event.stopPropagation();
                  control.onClick();
                }}
                role="button"
                aria-label={control.label}
              >
                <span className="pointer-events-none absolute inset-0 rounded-full bg-white/30 opacity-0 group-hover:opacity-100" />
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1 px-2 text-center text-[13px] font-semibold tracking-tight text-[color:var(--text-main)]">
            Control Overlay
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label={
                overlay.mode === "expanded"
                  ? "Switch to compact overlay"
                  : "Switch to expanded overlay"
              }
              onClick={(event) => {
                event.stopPropagation();
                overlay.toggleMode();
              }}
            >
              {overlay.mode === "expanded" ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {!standalone ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Open overlay in separate window"
                onClick={(event) => {
                  event.stopPropagation();
                  overlay.popOut();
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            ) : null}

            {!standalone ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Minimize overlay"
                onClick={(event) => {
                  event.stopPropagation();
                  overlay.minimizeOverlay();
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
            ) : null}

            {!standalone ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Close overlay"
                onClick={(event) => {
                  event.stopPropagation();
                  overlay.closeOverlay();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="h-[calc(100%-2.25rem)] min-h-0">
          <OverlayContent mode={mode} />
        </div>

        {!standalone ? (
          <button
            type="button"
            className="absolute bottom-2 right-2 h-3.5 w-3.5 cursor-nwse-resize rounded-sm bg-black/10 hover:bg-black/15 dark:bg-white/[0.10] dark:hover:bg-white/[0.14]"
            aria-label="Resize overlay"
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              resizeRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originW: bounds.w,
                originH: bounds.h,
              };
            }}
          />
        ) : null}
      </div>
    </section>
  );

  return standalone ? node : createPortal(node, document.body);
}
