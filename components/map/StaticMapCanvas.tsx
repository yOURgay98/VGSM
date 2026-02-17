"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StaticMapView = {
  centerX: number;
  centerY: number;
  zoom: number;
};

export type ToolPoint = {
  xNorm: number;
  yNorm: number;
  xPx: number;
  yPx: number;
  tool: "none" | "ping" | "pick_call_location" | "add_poi" | "draw_zone";
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function StaticMapCanvas({
  imageSrc = "/maps/erlc-map.png",
  className,
  activeTool,
  viewState,
  onViewStateChange,
  onToolPoint,
  overlays,
}: {
  imageSrc?: string;
  className?: string;
  activeTool: "none" | "ping" | "pick_call_location" | "add_poi" | "draw_zone";
  viewState?: StaticMapView | null;
  onViewStateChange?: (next: StaticMapView) => void;
  onToolPoint?: (point: ToolPoint) => void;
  overlays?: React.ReactNode | ((ctx: { width: number; height: number }) => React.ReactNode);
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const [naturalSize, setNaturalSize] = useState({ width: 1920, height: 1080 });
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });
  const [missingImage, setMissingImage] = useState(false);

  const [zoom, setZoom] = useState(viewState?.zoom ?? 1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const baseScale = useMemo(() => {
    const sx = containerSize.width / naturalSize.width;
    const sy = containerSize.height / naturalSize.height;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0) return 1;
    return Math.min(sx, sy);
  }, [containerSize.height, containerSize.width, naturalSize.height, naturalSize.width]);

  const scale = useMemo(() => baseScale * zoom, [baseScale, zoom]);

  const clampOffset = useCallback(
    (next: { x: number; y: number }) => {
      const margin = 120;
      const width = naturalSize.width * scale;
      const height = naturalSize.height * scale;

      const minX = Math.min(containerSize.width - width - margin, margin * -1);
      const maxX = Math.max(margin, containerSize.width - width + margin);
      const minY = Math.min(containerSize.height - height - margin, margin * -1);
      const maxY = Math.max(margin, containerSize.height - height + margin);

      return {
        x: clamp(next.x, minX, maxX),
        y: clamp(next.y, minY, maxY),
      };
    },
    [containerSize.height, containerSize.width, naturalSize.height, naturalSize.width, scale],
  );

  const applyViewState = useCallback(
    (nextView: StaticMapView) => {
      const nextZoom = clamp(nextView.zoom, 0.45, 8);
      setZoom(nextZoom);
      const nextScale = baseScale * nextZoom;
      const targetX = containerSize.width / 2 - nextView.centerX * naturalSize.width * nextScale;
      const targetY = containerSize.height / 2 - nextView.centerY * naturalSize.height * nextScale;
      setOffset(clampOffset({ x: targetX, y: targetY }));
    },
    [
      baseScale,
      clampOffset,
      containerSize.height,
      containerSize.width,
      naturalSize.height,
      naturalSize.width,
    ],
  );

  const emitView = useCallback(
    (nextOffset: { x: number; y: number }, nextZoom: number) => {
      if (!onViewStateChange) return;
      const nextScale = baseScale * nextZoom;
      const centerX = clamp(
        (containerSize.width / 2 - nextOffset.x) / (naturalSize.width * nextScale),
        0,
        1,
      );
      const centerY = clamp(
        (containerSize.height / 2 - nextOffset.y) / (naturalSize.height * nextScale),
        0,
        1,
      );
      onViewStateChange({ centerX, centerY, zoom: nextZoom });
    },
    [
      baseScale,
      containerSize.height,
      containerSize.width,
      naturalSize.height,
      naturalSize.width,
      onViewStateChange,
    ],
  );

  useEffect(() => {
    if (!viewState) return;
    applyViewState(viewState);
  }, [applyViewState, viewState]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerSize.width || !containerSize.height) return;
    const desired = viewState ?? { centerX: 0.5, centerY: 0.5, zoom: 1 };
    applyViewState(desired);
  }, [applyViewState, containerSize.height, containerSize.width, viewState]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag?.dragging) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.moved = true;
      const next = clampOffset({
        x: drag.originX + dx,
        y: drag.originY + dy,
      });
      setOffset(next);
      emitView(next, zoom);
    };

    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current.dragging = false;
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [clampOffset, emitView, zoom]);

  function zoomBy(step: number) {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const nextZoom = clamp(zoom + step, 0.45, 8);
    const nextScale = baseScale * nextZoom;

    const worldX = (cx - offset.x) / scale;
    const worldY = (cy - offset.y) / scale;
    const next = clampOffset({
      x: cx - worldX * nextScale,
      y: cy - worldY * nextScale,
    });

    setZoom(nextZoom);
    setOffset(next);
    emitView(next, nextZoom);
  }

  function resetView() {
    const next = { centerX: 0.5, centerY: 0.5, zoom: 1 };
    applyViewState(next);
    onViewStateChange?.(next);
  }

  function toPoint(clientX: number, clientY: number): Omit<ToolPoint, "tool"> | null {
    const element = containerRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const xPx = (localX - offset.x) / scale;
    const yPx = (localY - offset.y) / scale;
    if (!Number.isFinite(xPx) || !Number.isFinite(yPx)) return null;
    return {
      xPx,
      yPx,
      xNorm: clamp(xPx / naturalSize.width, 0, 1),
      yNorm: clamp(yPx / naturalSize.height, 0, 1),
    };
  }

  if (missingImage) {
    return (
      <div
        className={cn(
          "grid h-full place-items-center rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)]",
          className,
        )}
      >
        <div className="max-w-sm rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-center">
          <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
            {process.env.NODE_ENV !== "production"
              ? "Map image not installed. Place it at /public/maps/erlc-map.png"
              : "Map image is currently unavailable."}
          </p>
          <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">
            Upload `erlc-map.png` to the public maps directory and reload this page.
          </p>
        </div>
      </div>
    );
  }

  const overlayContent =
    typeof overlays === "function"
      ? overlays({ width: naturalSize.width, height: naturalSize.height })
      : overlays;

  return (
    <div
      ref={containerRef}
      data-tour="map-canvas"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)]",
        activeTool === "none" ? "cursor-grab" : "cursor-crosshair",
        className,
      )}
      onPointerDown={(event) => {
        if (activeTool !== "none") {
          return;
        }
        if (event.button !== 0) return;
        dragRef.current = {
          dragging: true,
          startX: event.clientX,
          startY: event.clientY,
          originX: offset.x,
          originY: offset.y,
          moved: false,
        };
      }}
      onClick={(event) => {
        if (dragRef.current?.moved) return;
        const point = toPoint(event.clientX, event.clientY);
        if (!point) return;
        onToolPoint?.({ ...point, tool: activeTool });
      }}
      onWheel={(event) => {
        event.preventDefault();
        const nextZoom = clamp(zoom + (event.deltaY < 0 ? 0.12 : -0.12), 0.45, 8);
        const point = toPoint(event.clientX, event.clientY);
        if (!point) return;

        const nextScale = baseScale * nextZoom;
        const element = containerRef.current;
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const next = clampOffset({
          x: localX - point.xPx * nextScale,
          y: localY - point.yPx * nextScale,
        });
        setZoom(nextZoom);
        setOffset(next);
        emitView(next, nextZoom);
      }}
    >
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: naturalSize.width,
          height: naturalSize.height,
          transformOrigin: "0 0",
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
        }}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="ERLC tactical map"
          className="pointer-events-none select-none"
          draggable={false}
          onLoad={() => {
            const img = imgRef.current;
            if (!img?.naturalWidth || !img.naturalHeight) return;
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            setMissingImage(false);
          }}
          onError={() => setMissingImage(true)}
        />
        <svg
          width={naturalSize.width}
          height={naturalSize.height}
          className="pointer-events-none absolute left-0 top-0"
          viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
        >
          {overlayContent}
        </svg>
      </div>

      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/92 p-1 shadow-[var(--panel-shadow)] backdrop-blur">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => zoomBy(0.12)}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => zoomBy(-0.12)}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={resetView}
          aria-label="Reset map view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
