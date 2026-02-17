"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldAlert, User, FolderKanban, Inbox, Activity } from "lucide-react";

import {
  runCommandAction,
  approveCommandAction,
  rejectCommandAction,
} from "@/app/actions/command-actions";
import { assignCaseToMeAction, assignReportToMeAction } from "@/app/actions/inbox-actions";
import { LiveActivityFeed } from "@/components/live/activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  actionTypeVariant,
  caseStatusVariant,
  playerStatusVariant,
  reportStatusVariant,
} from "@/lib/presenters";
import { cn, formatRelativeTime } from "@/lib/utils";

type OverlayMode = "compact" | "expanded";

type OverlayState = {
  now: {
    openReports: number;
    triageReports: number;
    pendingApprovals: number;
    activeSessions: number;
  };
  inbox: {
    reports: Array<{
      id: string;
      status: string;
      summary: string;
      createdAt: string;
      accusedPlayer: { id: string; name: string; status: string } | null;
    }>;
    cases: Array<{ id: string; title: string; status: string; createdAt: string }>;
  };
  assignedReports: Array<{
    id: string;
    status: string;
    summary: string;
    createdAt: string;
    accusedPlayer: { id: string; name: string; status: string } | null;
  }>;
  recentPlayers: Array<{ id: string; name: string; status: string; lastAt: string }>;
  assignedCases: Array<{ id: string; title: string; status: string; updatedAt: string }>;
  approvals: {
    canDecide: boolean;
    pendingCount: number;
    pending: Array<{
      id: string;
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
      status: "PENDING";
      createdAt: string;
      requestedByUser: { id: string; name: string; role: string };
      payloadJson: any;
    }>;
  };
};

type SearchResult = {
  players: Array<{ id: string; name: string; status: string }>;
  cases: Array<{ id: string; title: string; status: string }>;
  reports: Array<{ id: string; status: string; summary: string }>;
  users: Array<{ id: string; name: string; role: string; email: string }>;
  actions: Array<{
    id: string;
    type: string;
    createdAt: string;
    player: { id: string; name: string };
  }>;
};

const emptyOverlay: OverlayState = {
  now: { openReports: 0, triageReports: 0, pendingApprovals: 0, activeSessions: 0 },
  inbox: { reports: [], cases: [] },
  assignedReports: [],
  recentPlayers: [],
  assignedCases: [],
  approvals: { canDecide: false, pendingCount: 0, pending: [] },
};

const emptySearch: SearchResult = { players: [], cases: [], reports: [], users: [], actions: [] };

type Section = "search" | "inbox" | "recents" | "cases" | "feed";

function sectionLabel(section: Section) {
  switch (section) {
    case "search":
      return "Search";
    case "inbox":
      return "Inbox";
    case "recents":
      return "Recents";
    case "cases":
      return "Assigned";
    case "feed":
      return "Feed";
  }
}

function sectionIcon(section: Section) {
  switch (section) {
    case "search":
      return Search;
    case "inbox":
      return Inbox;
    case "recents":
      return User;
    case "cases":
      return FolderKanban;
    case "feed":
      return Activity;
  }
}

export function OverlayContent({ mode }: { mode: OverlayMode }) {
  const router = useRouter();
  const [overlay, setOverlay] = useState<OverlayState>(emptyOverlay);
  const [section, setSection] = useState<Section>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>(emptySearch);
  const [selected, setSelected] = useState<
    | { kind: "player"; id: string; name: string; status: string }
    | { kind: "case"; id: string; title: string; status: string }
    | { kind: "report"; id: string; status?: string; summary?: string }
    | { kind: "approval"; id: string }
    | null
  >(null);

  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [cmdStatus, setCmdStatus] = useState<{
    kind: "idle" | "error" | "success";
    message: string;
  }>({
    kind: "idle",
    message: "",
  });
  const [pending, setPending] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const layout = mode === "expanded";

  useEffect(() => {
    let handle: number | null = null;

    const tick = async () => {
      try {
        const res = await fetch("/api/overlay/state", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as OverlayState;
        setOverlay(payload);
      } catch {
        // Ignore.
      }
    };

    void tick();
    handle = window.setInterval(tick, 6_000);
    return () => {
      if (handle) window.clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    // In compact mode we always allow search; in expanded mode search runs only in the Search section.
    if (layout && section !== "search") return;
    const q = query.trim();
    if (q.length < 2) {
      setResults(emptySearch);
      return;
    }

    try {
      abortRef.current?.abort();
    } catch {
      // Ignore any abort-related runtime oddities.
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          if (!res.ok) return;
          const payload = (await res.json()) as SearchResult;
          setResults(payload);
        } catch (error) {
          if ((error as any)?.name === "AbortError") return;
        }
      })();
    }, 120);

    return () => {
      window.clearTimeout(timeout);
      try {
        controller.abort();
      } catch {
        // Ignore any abort-related runtime oddities.
      }
    };
  }, [query, section, layout]);

  const selectedApproval = useMemo(() => {
    if (!selected || selected.kind !== "approval") return null;
    return overlay.approvals.pending.find((a) => a.id === selected.id) ?? null;
  }, [overlay.approvals.pending, selected]);

  const selectedPlayer = useMemo(() => {
    if (!selected || selected.kind !== "player") return null;
    return selected;
  }, [selected]);

  const selectedCase = useMemo(() => {
    if (!selected || selected.kind !== "case") return null;
    return selected;
  }, [selected]);

  const selectedReport = useMemo(() => {
    if (!selected || selected.kind !== "report") return null;
    return (
      overlay.inbox.reports.find((r) => r.id === selected.id) ??
      overlay.assignedReports.find((r) => r.id === selected.id) ??
      (selected.status && selected.summary
        ? { id: selected.id, status: selected.status, summary: selected.summary }
        : null)
    );
  }, [overlay.assignedReports, overlay.inbox.reports, selected]);

  const selectedReportIsTriage = useMemo(() => {
    if (!selected || selected.kind !== "report") return false;
    return overlay.inbox.reports.some((r) => r.id === selected.id);
  }, [overlay.inbox.reports, selected]);

  const selectedCaseIsUnassigned = useMemo(() => {
    if (!selected || selected.kind !== "case") return false;
    return overlay.inbox.cases.some((c) => c.id === selected.id);
  }, [overlay.inbox.cases, selected]);

  async function runQuick(
    command: "warning.create" | "kick.record" | "ban.temp" | "ban.perm" | "player.flag",
  ) {
    if (!selectedPlayer) return;
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 6) {
      setCmdStatus({ kind: "error", message: "Reason must be at least 6 characters." });
      return;
    }

    setPending(true);
    setCmdStatus({ kind: "idle", message: "" });
    try {
      const result =
        command === "warning.create"
          ? await runCommandAction("warning.create", {
              playerId: selectedPlayer.id,
              reason: trimmed,
            })
          : command === "kick.record"
            ? await runCommandAction("kick.record", {
                playerId: selectedPlayer.id,
                reason: trimmed,
              })
            : command === "ban.temp"
              ? await runCommandAction("ban.temp", {
                  playerId: selectedPlayer.id,
                  durationMinutes,
                  reason: trimmed,
                  evidenceUrls: [],
                })
              : command === "ban.perm"
                ? await runCommandAction("ban.perm", {
                    playerId: selectedPlayer.id,
                    reason: trimmed,
                    evidenceUrls: [],
                  })
                : await runCommandAction("player.flag", {
                    playerId: selectedPlayer.id,
                    status: "WATCHED",
                    reason: trimmed,
                  });

      setCmdStatus({
        kind: "success",
        message:
          result.status === "pending_approval"
            ? "Approval requested. Check Inbox."
            : result.message,
      });
    } catch (error) {
      setCmdStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Command failed.",
      });
    } finally {
      setPending(false);
    }
  }

  async function approveSelected() {
    if (!selectedApproval) return;
    setPending(true);
    setCmdStatus({ kind: "idle", message: "" });
    try {
      const result = await approveCommandAction(selectedApproval.id);
      setCmdStatus({ kind: "success", message: result.message });
      setSelected(null);
    } catch (error) {
      setCmdStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Approval failed.",
      });
    } finally {
      setPending(false);
    }
  }

  async function rejectSelected() {
    if (!selectedApproval) return;
    setPending(true);
    setCmdStatus({ kind: "idle", message: "" });
    try {
      await rejectCommandAction(selectedApproval.id, reason.trim() || undefined);
      setCmdStatus({ kind: "success", message: "Request rejected." });
      setSelected(null);
    } catch (error) {
      setCmdStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Reject failed.",
      });
    } finally {
      setPending(false);
    }
  }

  async function refreshOverlayOnce() {
    try {
      const res = await fetch("/api/overlay/state", { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as OverlayState;
      setOverlay(payload);
    } catch {
      // Ignore.
    }
  }

  async function assignSelectedReportToMe() {
    if (!selectedReport) return;
    setPending(true);
    setCmdStatus({ kind: "idle", message: "" });
    try {
      await assignReportToMeAction(selectedReport.id);
      setCmdStatus({ kind: "success", message: "Assigned report to you." });
      void refreshOverlayOnce();
    } catch (error) {
      setCmdStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Assign failed.",
      });
    } finally {
      setPending(false);
    }
  }

  async function assignSelectedCaseToMe() {
    if (!selectedCase) return;
    setPending(true);
    setCmdStatus({ kind: "idle", message: "" });
    try {
      await assignCaseToMeAction(selectedCase.id);
      setCmdStatus({ kind: "success", message: "Assigned case to you." });
      void refreshOverlayOnce();
    } catch (error) {
      setCmdStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Assign failed.",
      });
    } finally {
      setPending(false);
    }
  }

  const quickStatusTone =
    cmdStatus.kind === "error"
      ? "text-rose-600"
      : cmdStatus.kind === "success"
        ? "text-emerald-600"
        : "text-[color:var(--text-muted)]";

  if (!layout) {
    return (
      <div className="flex h-full flex-col gap-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              Now
            </p>
            <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[color:var(--text-muted)]">Reports</span>
                <span className="font-medium text-[color:var(--text-main)]">
                  {overlay.now.openReports}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[color:var(--text-muted)]">Triage</span>
                <span className="font-medium text-[color:var(--text-main)]">
                  {overlay.now.triageReports}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[color:var(--text-muted)]">Approvals</span>
                <span className="font-medium text-[color:var(--text-main)]">
                  {overlay.now.pendingApprovals}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[color:var(--text-muted)]">Sessions</span>
                <span className="font-medium text-[color:var(--text-main)]">
                  {overlay.now.activeSessions}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              Inbox
            </p>
            <p className="mt-1 text-[13px] text-[color:var(--text-main)]">
              {overlay.inbox.reports.length + overlay.inbox.cases.length} items
            </p>
            <Link
              href="/app/inbox"
              className="ui-transition mt-1 inline-block text-[13px] font-medium text-[color:var(--accent)] hover:underline"
            >
              Open Inbox
            </Link>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players, cases, reports"
            className="h-8 pl-9"
          />
        </div>

        {results.players.length || results.cases.length || results.reports.length ? (
          <div className="max-h-40 overflow-auto rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)]">
            {results.players.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                className="ui-transition flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                onClick={() =>
                  setSelected({ kind: "player", id: p.id, name: p.name, status: p.status })
                }
              >
                <span className="font-medium text-[color:var(--text-main)]">{p.name}</span>
                <Badge variant={playerStatusVariant(p.status as any)}>{p.status}</Badge>
              </button>
            ))}
            {results.cases.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                className="ui-transition flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                onClick={() =>
                  setSelected({ kind: "case", id: c.id, title: c.title, status: c.status })
                }
              >
                <span className="truncate font-medium text-[color:var(--text-main)]">
                  {c.title}
                </span>
                <Badge variant={caseStatusVariant(c.status as any)}>{c.status}</Badge>
              </button>
            ))}
            {results.reports.slice(0, 4).map((r) => (
              <button
                key={r.id}
                type="button"
                className="ui-transition flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
                onClick={() =>
                  setSelected({ kind: "report", id: r.id, status: r.status, summary: r.summary })
                }
              >
                <span className="truncate font-medium text-[color:var(--text-main)]">
                  {r.summary}
                </span>
                <Badge variant={reportStatusVariant(r.status as any)}>{r.status}</Badge>
              </button>
            ))}
          </div>
        ) : null}

        {selectedPlayer ? (
          <div className="min-h-0 flex-1 space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[color:var(--text-main)]">
                  {selectedPlayer.name}
                </p>
                <p className="text-xs text-[color:var(--text-muted)]">Quick commands</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/app/players/${selectedPlayer.id}`)}
              >
                Open
              </Button>
            </div>

            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason..."
              className="min-h-[64px]"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runQuick("warning.create")}
              >
                Warning
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runQuick("kick.record")}
              >
                Kick
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runQuick("player.flag")}
              >
                Flag
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={pending}
                onClick={() => runQuick("ban.temp")}
              >
                Temp Ban
              </Button>
            </div>

            <p role="status" aria-live="polite" className={cn("text-xs", quickStatusTone)}>
              {cmdStatus.message || " "}
            </p>
          </div>
        ) : selectedCase ? (
          <div className="min-h-0 flex-1 space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Case</p>
            <p className="text-[13px] text-[color:var(--text-main)]">{selectedCase.title}</p>
            <div>
              <Badge variant={caseStatusVariant(selectedCase.status as any)}>
                {selectedCase.status}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push(`/app/cases/${selectedCase.id}`)}
            >
              Open Case
            </Button>
          </div>
        ) : selectedReport ? (
          <div className="min-h-0 flex-1 space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Report</p>
            <div>
              <Badge variant={reportStatusVariant(selectedReport.status as any)}>
                {selectedReport.status}
              </Badge>
            </div>
            <p className="text-[13px] text-[color:var(--text-main)]">{selectedReport.summary}</p>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                router.push(`/app/reports?reportId=${encodeURIComponent(selectedReport.id)}`)
              }
            >
              Open Report
            </Button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">Ready</p>
            <p className="mt-0.5 text-[13px] text-[color:var(--text-muted)]">
              Pick a player to run quick actions, or pop out the overlay for full control.
            </p>
          </div>
        )}

        <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
            Recents
          </p>
          <div className="mt-1 space-y-1">
            {overlay.recentPlayers.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setSelected({ kind: "player", id: p.id, name: p.name, status: p.status })
                }
                className="ui-transition flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
              >
                <span className="truncate">{p.name}</span>
                <span className="text-xs text-[color:var(--text-muted)]">
                  {formatRelativeTime(new Date(p.lastAt))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[56px_1fr_320px]">
      <nav className="min-h-0 border-r border-[color:var(--border)] bg-[color:var(--sidebar-bg)] p-2">
        <div className="flex flex-col gap-1">
          {(["search", "inbox", "recents", "cases", "feed"] as const).map((key) => {
            const Icon = sectionIcon(key);
            const active = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSection(key);
                  setSelected(null);
                  setCmdStatus({ kind: "idle", message: "" });
                }}
                className={cn(
                  "ui-transition flex h-10 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium text-[color:var(--text-muted)] hover:bg-black/[0.03] hover:text-[color:var(--text-main)] dark:hover:bg-white/[0.07]",
                  active &&
                    "bg-white/70 text-[color:var(--text-main)] shadow-[var(--panel-shadow)] dark:bg-white/[0.09]",
                )}
                aria-label={sectionLabel(key)}
                title={sectionLabel(key)}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </nav>

      <div className="min-h-0 border-r border-[color:var(--border)] bg-[color:var(--surface-muted)]">
        <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
          <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
            {sectionLabel(section)}
          </p>
          <span className="ml-auto text-xs text-[color:var(--text-muted)]">
            {section === "inbox"
              ? `Triage: ${overlay.now.triageReports} | Approvals: ${overlay.approvals.pendingCount}`
              : ""}
          </span>
        </div>

        {section === "search" ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search players, cases, reports"
                  className="h-8 pl-9"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2">
              <div className="space-y-1">
                {results.players.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelected({ kind: "player", id: p.id, name: p.name, status: p.status })
                    }
                    className={cn(
                      "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                      selected?.kind === "player" &&
                        selected.id === p.id &&
                        "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                    )}
                  >
                    <span className="truncate font-medium text-[color:var(--text-main)]">
                      {p.name}
                    </span>
                    <Badge variant={playerStatusVariant(p.status as any)}>{p.status}</Badge>
                  </button>
                ))}
              </div>

              {results.cases.length ? (
                <div className="mt-2 space-y-1 border-t border-[color:var(--border)] pt-2">
                  {results.cases.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelected({ kind: "case", id: c.id, title: c.title, status: c.status })
                      }
                      className={cn(
                        "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                        selected?.kind === "case" &&
                          selected.id === c.id &&
                          "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                      )}
                    >
                      <span className="truncate font-medium text-[color:var(--text-main)]">
                        {c.title}
                      </span>
                      <Badge variant={caseStatusVariant(c.status as any)}>{c.status}</Badge>
                    </button>
                  ))}
                </div>
              ) : null}

              {results.reports.length ? (
                <div className="mt-2 space-y-1 border-t border-[color:var(--border)] pt-2">
                  {results.reports.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setSelected({
                          kind: "report",
                          id: r.id,
                          status: r.status,
                          summary: r.summary,
                        })
                      }
                      className={cn(
                        "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                        selected?.kind === "report" &&
                          selected.id === r.id &&
                          "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                      )}
                    >
                      <span className="truncate font-medium text-[color:var(--text-main)]">
                        {r.summary}
                      </span>
                      <Badge variant={reportStatusVariant(r.status as any)}>{r.status}</Badge>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : section === "inbox" ? (
          <div className="min-h-0 overflow-auto p-2">
            <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                Now
              </p>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[color:var(--text-muted)]">Reports</span>
                  <span className="font-medium text-[color:var(--text-main)]">
                    {overlay.now.openReports}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[color:var(--text-muted)]">Triage</span>
                  <span className="font-medium text-[color:var(--text-main)]">
                    {overlay.now.triageReports}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[color:var(--text-muted)]">Approvals</span>
                  <span className="font-medium text-[color:var(--text-main)]">
                    {overlay.now.pendingApprovals}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[color:var(--text-muted)]">Sessions</span>
                  <span className="font-medium text-[color:var(--text-main)]">
                    {overlay.now.activeSessions}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                Triage Reports
              </p>
              {overlay.inbox.reports.length === 0 ? (
                <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">
                  No reports need triage.
                </p>
              ) : (
                overlay.inbox.reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setSelected({
                        kind: "report",
                        id: r.id,
                        status: r.status,
                        summary: r.summary,
                      })
                    }
                    className={cn(
                      "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                      selected?.kind === "report" &&
                        selected.id === r.id &&
                        "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[color:var(--text-main)]">
                        {r.accusedPlayer ? `${r.accusedPlayer.name}: ${r.summary}` : r.summary}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                        {formatRelativeTime(new Date(r.createdAt))}
                      </p>
                    </div>
                    <Badge variant={reportStatusVariant(r.status as any)}>{r.status}</Badge>
                  </button>
                ))
              )}
            </div>

            <div className="mt-2 space-y-1 border-t border-[color:var(--border)] pt-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                Unassigned Cases
              </p>
              {overlay.inbox.cases.length === 0 ? (
                <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">
                  No unassigned cases.
                </p>
              ) : (
                overlay.inbox.cases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setSelected({ kind: "case", id: c.id, title: c.title, status: c.status })
                    }
                    className={cn(
                      "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                      selected?.kind === "case" &&
                        selected.id === c.id &&
                        "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[color:var(--text-main)]">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                        {formatRelativeTime(new Date(c.createdAt))}
                      </p>
                    </div>
                    <Badge variant={caseStatusVariant(c.status as any)}>{c.status}</Badge>
                  </button>
                ))
              )}
            </div>

            <div className="mt-2 space-y-1 border-t border-[color:var(--border)] pt-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                Approvals
              </p>
              {overlay.approvals.pending.length === 0 ? (
                <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">
                  No pending approvals.
                </p>
              ) : (
                overlay.approvals.pending.map((a) => {
                  const cmdId = a.payloadJson?.commandId as string | undefined;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected({ kind: "approval", id: a.id })}
                      className={cn(
                        "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                        selected?.kind === "approval" &&
                          selected.id === a.id &&
                          "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                      )}
                    >
                      <span className="min-w-0 truncate font-medium text-[color:var(--text-main)]">
                        {cmdId ?? "Command"}{" "}
                        <span className="font-normal text-[color:var(--text-muted)]">
                          - {a.requestedByUser.name}
                        </span>
                      </span>
                      <Badge variant={actionTypeVariant("TEMP_BAN" as any)}>{a.riskLevel}</Badge>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : section === "recents" ? (
          <div className="min-h-0 overflow-auto p-2">
            {overlay.recentPlayers.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-[color:var(--text-muted)]">
                No recent players.
              </p>
            ) : (
              overlay.recentPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    setSelected({ kind: "player", id: p.id, name: p.name, status: p.status })
                  }
                  className={cn(
                    "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                    selected?.kind === "player" &&
                      selected.id === p.id &&
                      "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                  )}
                >
                  <span className="truncate font-medium text-[color:var(--text-main)]">
                    {p.name}
                  </span>
                  <span className="text-xs text-[color:var(--text-muted)]">
                    {formatRelativeTime(new Date(p.lastAt))}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : section === "cases" ? (
          <div className="min-h-0 overflow-auto p-2">
            {overlay.assignedReports.length === 0 && overlay.assignedCases.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-[color:var(--text-muted)]">
                No assigned work.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                    Reports
                  </p>
                  {overlay.assignedReports.length === 0 ? (
                    <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">
                      No assigned reports.
                    </p>
                  ) : (
                    overlay.assignedReports.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          setSelected({
                            kind: "report",
                            id: r.id,
                            status: r.status,
                            summary: r.summary,
                          })
                        }
                        className={cn(
                          "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                          selected?.kind === "report" &&
                            selected.id === r.id &&
                            "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[color:var(--text-main)]">
                            {r.accusedPlayer ? `${r.accusedPlayer.name}: ${r.summary}` : r.summary}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {formatRelativeTime(new Date(r.createdAt))}
                          </p>
                        </div>
                        <Badge variant={reportStatusVariant(r.status as any)}>{r.status}</Badge>
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-2 space-y-1 border-t border-[color:var(--border)] pt-2">
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                    Cases
                  </p>
                  {overlay.assignedCases.length === 0 ? (
                    <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">
                      No assigned cases.
                    </p>
                  ) : (
                    overlay.assignedCases.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setSelected({ kind: "case", id: c.id, title: c.title, status: c.status })
                        }
                        className={cn(
                          "ui-transition flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                          selected?.kind === "case" &&
                            selected.id === c.id &&
                            "border-[color:var(--border)] bg-white/70 dark:bg-white/[0.08]",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[color:var(--text-main)]">
                            {c.title}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            {formatRelativeTime(new Date(c.updatedAt))}
                          </p>
                        </div>
                        <Badge variant={caseStatusVariant(c.status as any)}>{c.status}</Badge>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="min-h-0 overflow-auto p-2">
            <LiveActivityFeed />
          </div>
        )}
      </div>

      <div className="min-h-0 bg-[color:var(--surface)]">
        <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
          <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Inspector</p>
        </div>

        <div className="min-h-0 overflow-auto p-3">
          {selectedPlayer ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
                    {selectedPlayer.name}
                  </p>
                  <div className="mt-1">
                    <Badge variant={playerStatusVariant(selectedPlayer.status as any)}>
                      {selectedPlayer.status}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/app/players/${selectedPlayer.id}`)}
                >
                  Open
                </Button>
              </div>

              <div className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Quick Actions
                </p>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason..."
                  className="min-h-[78px]"
                />

                <div className="grid gap-2">
                  <SegmentedControl
                    ariaLabel="Temp ban duration"
                    value={String(durationMinutes)}
                    onChange={(val) => setDurationMinutes(Number(val))}
                    options={[
                      { value: "30", label: "30m" },
                      { value: "60", label: "1h" },
                      { value: "180", label: "3h" },
                      { value: "1440", label: "24h" },
                    ]}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => runQuick("warning.create")}
                    >
                      Warning
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => runQuick("kick.record")}
                    >
                      Kick
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => runQuick("player.flag")}
                    >
                      Flag
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={pending}
                      onClick={() => runQuick("ban.temp")}
                    >
                      Temp Ban
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={pending}
                      onClick={() => runQuick("ban.perm")}
                    >
                      Perm Ban
                    </Button>
                  </div>
                </div>

                <p
                  role="status"
                  aria-live="polite"
                  className={cn("min-h-4 text-xs", quickStatusTone)}
                >
                  {cmdStatus.message || " "}
                </p>
              </div>
            </div>
          ) : selectedCase ? (
            <div className="space-y-3">
              <div>
                <p className="text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
                  {selectedCase.title}
                </p>
                <div className="mt-1">
                  <Badge variant={caseStatusVariant(selectedCase.status as any)}>
                    {selectedCase.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCaseIsUnassigned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={assignSelectedCaseToMe}
                  >
                    Assign to me
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(`/app/cases/${selectedCase.id}`)}
                >
                  Open Case
                </Button>
              </div>
              <p
                role="status"
                aria-live="polite"
                className={cn("min-h-4 text-xs", quickStatusTone)}
              >
                {cmdStatus.message || " "}
              </p>
            </div>
          ) : selectedReport ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Report</p>
                  <Badge variant={reportStatusVariant(selectedReport.status as any)}>
                    {selectedReport.status}
                  </Badge>
                </div>
                {"accusedPlayer" in selectedReport && selectedReport.accusedPlayer ? (
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    Accused: {selectedReport.accusedPlayer.name}
                  </p>
                ) : null}
                {"createdAt" in selectedReport && selectedReport.createdAt ? (
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    {formatRelativeTime(new Date(selectedReport.createdAt))}
                  </p>
                ) : null}
                <p className="mt-2 text-[13px] text-[color:var(--text-main)]">
                  {selectedReport.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedReportIsTriage ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={assignSelectedReportToMe}
                  >
                    Assign to me
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    router.push(`/app/reports?reportId=${encodeURIComponent(selectedReport.id)}`)
                  }
                >
                  Open Report
                </Button>
              </div>

              <p
                role="status"
                aria-live="polite"
                className={cn("min-h-4 text-xs", quickStatusTone)}
              >
                {cmdStatus.message || " "}
              </p>
            </div>
          ) : selectedApproval ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
                    Approval Request
                  </p>
                  <Badge variant={actionTypeVariant("TEMP_BAN" as any)}>
                    {selectedApproval.riskLevel}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  Requested by {selectedApproval.requestedByUser.name} ·{" "}
                  {formatRelativeTime(new Date(selectedApproval.createdAt))}
                </p>
                <code className="mt-2 block max-h-32 overflow-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] p-2 text-xs text-[color:var(--text-muted)]">
                  {JSON.stringify(selectedApproval.payloadJson, null, 2)}
                </code>
              </div>

              {overlay.approvals.canDecide ? (
                <div className="space-y-2">
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Decision note (optional)"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={pending}
                      onClick={approveSelected}
                    >
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={rejectSelected}>
                      Reject
                    </Button>
                  </div>
                  <p
                    role="status"
                    aria-live="polite"
                    className={cn("min-h-4 text-xs", quickStatusTone)}
                  >
                    {cmdStatus.message || " "}
                  </p>
                </div>
              ) : (
                <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-[13px] text-[color:var(--text-muted)]">
                  You don't have approval permissions. Open Inbox to view status.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 text-[color:var(--text-muted)]" />
                <div>
                  <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                    No selection
                  </p>
                  <p className="mt-0.5 text-[13px] text-[color:var(--text-muted)]">
                    Select a player, report, case, or approval to inspect and act.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
