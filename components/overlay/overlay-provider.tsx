"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { ControlOverlay } from "@/components/overlay/control-overlay";

type OverlayMode = "compact" | "expanded";

type OverlayContextValue = {
  open: boolean;
  minimized: boolean;
  mode: OverlayMode;
  openOverlay: () => void;
  closeOverlay: () => void;
  toggleOverlay: () => void;
  minimizeOverlay: () => void;
  restoreOverlay: () => void;
  toggleMode: () => void;
  popOut: () => void;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

const STORAGE_KEY = "erlc.overlay.v1";

function readPersisted() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<{ open: boolean; minimized: boolean; mode: OverlayMode }>;
  } catch {
    return null;
  }
}

export function OverlayProvider({
  children,
  renderOverlay = true,
}: {
  children: React.ReactNode;
  renderOverlay?: boolean;
}) {
  // Do not read localStorage during SSR/initial render (prevents hydration mismatches).
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mode, setMode] = useState<OverlayMode>("compact");

  useEffect(() => {
    const persisted = readPersisted();
    if (persisted) {
      setOpen(Boolean(persisted.open));
      setMinimized(Boolean(persisted.minimized));
      setMode(persisted.mode === "expanded" ? "expanded" : "compact");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ open, minimized, mode }));
    } catch {
      // Ignore.
    }
  }, [hydrated, minimized, mode, open]);

  const value = useMemo<OverlayContextValue>(
    () => ({
      open,
      minimized,
      mode,
      openOverlay: () => {
        setOpen(true);
        setMinimized(false);
      },
      closeOverlay: () => {
        setOpen(false);
        setMinimized(false);
      },
      toggleOverlay: () => {
        setOpen((prev) => !prev);
        setMinimized(false);
      },
      minimizeOverlay: () => {
        setOpen(true);
        setMinimized(true);
      },
      restoreOverlay: () => {
        setOpen(true);
        setMinimized(false);
      },
      toggleMode: () => setMode((prev) => (prev === "compact" ? "expanded" : "compact")),
      popOut: () => {
        const w = 980;
        const h = 680;
        const left = Math.max(80, Math.round((window.screen.width - w) / 2));
        const top = Math.max(60, Math.round((window.screen.height - h) / 3));
        window.open(
          "/overlay",
          "erlc-control-overlay",
          `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
        );
      },
    }),
    [minimized, mode, open],
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {renderOverlay ? <ControlOverlay /> : null}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used within OverlayProvider.");
  }
  return ctx;
}
