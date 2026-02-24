"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellDot, Loader2, ScrollText, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";

type ActivityEvent = {
  id: string;
  createdAt: string;
  eventType: string;
  user: { id: string; name: string; role: string } | null;
};

function eventLabel(eventType: string) {
  if (eventType.startsWith("security.")) return "Security event";
  if (eventType.startsWith("approval.")) return "Approval update";
  if (eventType.startsWith("command.")) return "Command activity";
  if (eventType.startsWith("integrations.")) return "Integration activity";
  if (eventType.startsWith("invite.")) return "Invite activity";
  if (eventType.startsWith("case.")) return "Case activity";
  if (eventType.startsWith("report.")) return "Report activity";
  return eventType.replace(/\./g, " ");
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/live/activity", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const payload = (await res.json()) as { events?: ActivityEvent[] };
      setEvents(Array.isArray(payload.events) ? payload.events.slice(-8).reverse() : []);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || loaded || loading) return;
    void load();
  }, [loaded, loading, load, open]);

  const hasSecuritySignal = useMemo(
    () =>
      events.some(
        (event) =>
          event.eventType.startsWith("security.") || event.eventType.includes("failed"),
      ),
    [events],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notifications">
          {hasSecuritySignal ? <BellDot className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            Early access
          </span>
        </DropdownMenuLabel>
        <p className="px-2 pb-1 text-xs text-[color:var(--text-muted)]">
          System updates and alert summaries from recent activity.
        </p>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-[color:var(--text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading events...
          </div>
        ) : null}

        {!loading && error ? (
          <div className="space-y-2 px-2 py-2">
            <p className="text-xs text-[color:var(--text-muted)]">
              Notification feed is temporarily unavailable.
            </p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!loading && !error && events.length === 0 ? (
          <div className="px-2 py-3 text-xs text-[color:var(--text-muted)]">
            No new alerts yet. Recent events will appear here.
          </div>
        ) : null}

        {!loading && !error && events.length > 0 ? (
          <div className="max-h-[260px] overflow-auto">
            {events.map((event) => (
              <div key={event.id} className="border-b border-[color:var(--border)] px-2 py-2 last:border-b-0">
                <p className="text-xs font-medium text-[color:var(--text-main)]">
                  {eventLabel(event.eventType)}
                </p>
                <p className="mt-0.5 text-[11px] text-[color:var(--text-muted)]">
                  {event.user?.name ?? "System"} •{" "}
                  {formatRelativeTime(new Date(event.createdAt))}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/security" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Open SOC
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/audit" className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Open Audit
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

