"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn, formatRelativeTime } from "@/lib/utils";

type PresenceEntry = {
  userId: string;
  name: string;
  role: string;
  sessionCount: number;
  lastActiveAt: string;
  currentPath: string | null;
};

function sectionLabel(path: string | null) {
  if (!path) return null;
  if (path.startsWith("/app/dashboard")) return "Dashboard";
  if (path.startsWith("/app/inbox")) return "Inbox";
  if (path.startsWith("/app/players")) return "Players";
  if (path.startsWith("/app/cases")) return "Cases";
  if (path.startsWith("/app/reports")) return "Reports";
  if (path.startsWith("/app/actions")) return "Actions";
  if (path.startsWith("/app/commands")) return "Commands";
  if (path.startsWith("/app/audit")) return "Logs";
  if (path.startsWith("/app/security")) return "Security";
  if (path.startsWith("/app/settings")) return "Settings";
  if (path.startsWith("/app/profile")) return "Profile";
  if (path.startsWith("/overlay")) return "Overlay";
  return "App";
}

export function StaffPresencePanel({
  className,
  pollMs = 10_000,
  max = 10,
}: {
  className?: string;
  pollMs?: number;
  max?: number;
}) {
  const [entries, setEntries] = useState<PresenceEntry[]>([]);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let handle: number | null = null;

    const tick = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { staff: PresenceEntry[] };
        setEntries(payload.staff ?? []);
      } catch {
        // Ignore.
      } finally {
        fetchingRef.current = false;
      }
    };

    void tick();
    handle = window.setInterval(tick, pollMs);
    return () => {
      if (handle) window.clearInterval(handle);
    };
  }, [pollMs]);

  const rendered = useMemo(() => entries.slice(0, max), [entries, max]);

  if (rendered.length === 0) {
    return (
      <p className={cn("text-[13px] text-[color:var(--text-muted)]", className)}>
        No staff online.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1.5", className)}>
      {rendered.map((entry) => {
        const label = sectionLabel(entry.currentPath);
        const last = new Date(entry.lastActiveAt);
        return (
          <li
            key={entry.userId}
            className="ui-transition flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                <span
                  className="mr-2 inline-flex h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-emerald-500/70"
                  aria-hidden
                />
                {entry.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                {entry.role}
                {label ? ` · ${label}` : ""} · {entry.sessionCount} session
                {entry.sessionCount === 1 ? "" : "s"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-[color:var(--text-muted)]">
              {formatRelativeTime(last)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
