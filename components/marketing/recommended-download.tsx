"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

type Platform = "win" | "mac" | "linux";

const PLATFORM_LABEL: Record<Platform, string> = {
  win: "Windows",
  mac: "macOS",
  linux: "Linux",
};

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "win";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac os") || ua.includes("darwin")) return "mac";
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  return "win";
}

export function RecommendedDownloadButton({
  className,
  availablePlatforms,
}: {
  className?: string;
  availablePlatforms: Platform[];
}) {
  const detected = useMemo(() => detectPlatform(), []);

  const platform = useMemo(() => {
    // Prefer the detected OS, but always pick a platform that actually has a build.
    if (availablePlatforms.length === 0) return detected;
    if (availablePlatforms.includes(detected)) return detected;
    const preferredOrder: Platform[] = ["win", "mac", "linux"];
    const fallback = preferredOrder.find((p) => availablePlatforms.includes(p)) || detected;
    return fallback;
  }, [availablePlatforms, detected]);

  const label = PLATFORM_LABEL[platform];
  const isFallback = platform !== detected;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
        {isFallback ? `Available build: ${label}` : `Recommended for ${label}`}
      </p>
      <a
        href={`/api/download/latest?platform=${platform}`}
        className="mkt-btn mkt-btn-primary w-full sm:w-auto"
      >
        Download for {label}
      </a>
      {isFallback ? (
        <p className="text-xs text-white/55">
          Your OS was detected as {PLATFORM_LABEL[detected]}. A matching build is not published yet.
        </p>
      ) : null}
    </div>
  );
}
