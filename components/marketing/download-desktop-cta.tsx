"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type Platform = "win" | "mac" | "linux";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "win";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac os") || ua.includes("darwin")) return "mac";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "win";
}

export function DownloadDesktopCta({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const isDev = process.env.NODE_ENV !== "production";
  const platform = useMemo(() => detectPlatform(), []);

  async function onDownload() {
    setLoading(true);
    setError(null);
    setActivePlatform(platform);
    try {
      const res = await fetch(`/api/download/latest?platform=${platform}&format=json`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as { url?: string; code?: string; message?: string };
      if (!res.ok || payload.code === "not_available" || !payload.url) {
        setError("Desktop build not uploaded yet.");
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("Unable to reach download endpoint.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className={cn(
          "ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border px-4 text-[13px] font-semibold",
          "border-white/10 bg-white/[0.04] text-white/90 hover:bg-white/[0.08]",
          "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {loading ? "Preparing download..." : "Download Desktop"}
      </button>
      {error ? (
        <div className="rounded-[var(--radius-control)] border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/65">
          <p className="font-medium text-white">{error}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              href="/app"
              className="ui-transition font-medium text-white/80 hover:text-white hover:underline"
            >
              Open Web App
            </Link>
            <span className="text-white/55">Platform: {activePlatform ?? platform}</span>
            {isDev ? (
              <Link
                href="/docs/integrations#desktop"
                className="ui-transition font-medium text-white/80 hover:text-white hover:underline"
              >
                Build desktop app
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
