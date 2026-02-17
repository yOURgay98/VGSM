"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type ActivityEvent = {
  id: string;
  chainIndex: number;
  createdAt: string;
  eventType: string;
  user: { id: string; name: string; role: string } | null;
  metadataJson: unknown;
};

const DEFAULT_POLL_MS = 4_000;
const MAX_EVENTS = 60;

function toneForEvent(eventType: string) {
  if (eventType.startsWith("login.")) return "info";
  if (eventType.startsWith("2fa.") || eventType.startsWith("password.")) return "warning";
  if (
    eventType.startsWith("user.") ||
    eventType.startsWith("role.") ||
    eventType.startsWith("settings.")
  )
    return "warning";
  if (eventType.startsWith("approval.")) return "warning";
  if (
    eventType.startsWith("action.") ||
    eventType.startsWith("case.") ||
    eventType.startsWith("report.")
  )
    return "success";
  if (eventType.startsWith("command.")) return "info";
  return "muted";
}

function dotClass(tone: string) {
  switch (tone) {
    case "success":
      return "bg-emerald-500/70";
    case "warning":
      return "bg-amber-500/70";
    case "danger":
      return "bg-rose-500/70";
    case "info":
      return "bg-sky-500/70";
    default:
      return "bg-[color:var(--text-muted)]/50";
  }
}

export function LiveActivityFeed({
  className,
  pollMs = DEFAULT_POLL_MS,
  compact = false,
}: {
  className?: string;
  pollMs?: number;
  compact?: boolean;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [since, setSince] = useState(0);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let handle: number | null = null;

    const tick = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await fetch(`/api/live/activity?since=${since}`, { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { events: ActivityEvent[]; nextSince: number };
        if (!mountedRef.current) return;

        if (payload.events?.length) {
          setEvents((prev) => {
            const next = [...prev, ...payload.events];
            // De-dupe by chainIndex while keeping order.
            const seen = new Set<number>();
            const unique: ActivityEvent[] = [];
            for (const ev of next) {
              if (seen.has(ev.chainIndex)) continue;
              seen.add(ev.chainIndex);
              unique.push(ev);
            }
            return unique.slice(-MAX_EVENTS);
          });
        }
        if (typeof payload.nextSince === "number" && payload.nextSince > since) {
          setSince(payload.nextSince);
        }
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
  }, [pollMs, since]);

  const rendered = useMemo(() => {
    if (compact) return events.slice(-8);
    return events.slice(-18);
  }, [compact, events]);

  if (rendered.length === 0) {
    return (
      <div className={cn("text-[13px] text-[color:var(--text-muted)]", className)}>
        No activity yet.
      </div>
    );
  }

  return (
    <ul className={cn("space-y-1.5", className)}>
      {rendered.map((ev) => {
        const tone = toneForEvent(ev.eventType);
        return (
          <li
            key={ev.id}
            className={cn(
              "ui-transition flex items-start gap-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2",
              compact && "py-1.5",
            )}
          >
            <span
              aria-hidden
              className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass(tone))}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-[13px] text-[color:var(--text-main)]",
                  compact && "text-[12.5px]",
                )}
              >
                <span className="font-medium">{ev.user?.name ?? "System"}</span>{" "}
                <span className="text-[color:var(--text-muted)]">{ev.eventType}</span>
              </p>
              {!compact && ev.metadataJson ? (
                <code className="mt-0.5 line-clamp-1 text-xs text-[color:var(--text-muted)]">
                  {JSON.stringify(ev.metadataJson)}
                </code>
              ) : null}
            </div>
            <time
              className="shrink-0 text-xs text-[color:var(--text-muted)]"
              dateTime={ev.createdAt}
            >
              {new Date(ev.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
