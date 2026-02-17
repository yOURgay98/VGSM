"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, ShieldAlert } from "lucide-react";

import { runCommandAction } from "@/app/actions/command-actions";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CommandMeta = {
  id: string;
  name: string;
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  enabled: boolean;
  fields: Array<
    | { name: string; label: string; type: "text"; placeholder?: string; required?: boolean }
    | { name: string; label: string; type: "textarea"; placeholder?: string; required?: boolean }
    | {
        name: string;
        label: string;
        type: "number";
        placeholder?: string;
        required?: boolean;
        min?: number;
        max?: number;
      }
    | {
        name: string;
        label: string;
        type: "select";
        required?: boolean;
        options: Array<{ value: string; label: string }>;
      }
    | { name: string; label: string; type: "multi"; required?: boolean; placeholder?: string }
  >;
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

const emptyResults: SearchResult = {
  players: [],
  cases: [],
  reports: [],
  users: [],
  actions: [],
};

function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

export function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [cmdLoading, setCmdLoading] = useState(false);
  const [commands, setCommands] = useState<CommandMeta[]>([]);
  const [results, setResults] = useState<SearchResult>(emptyResults);

  const [selectedCommand, setSelectedCommand] = useState<CommandMeta | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; message: string }>({
    kind: "idle",
    message: "",
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(true);
  const searchSeq = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/commands/meta", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { commands: CommandMeta[] };
        if (cancelled) return;
        setCommands(payload.commands ?? []);
      } catch {
        // Ignore.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearchLoading(false);
      setResults(emptyResults);
      return;
    }

    const q = query.trim();
    if (q.length < 2) {
      setSearchLoading(false);
      setResults(emptyResults);
      return;
    }

    // Avoid surfacing aborts as runtime errors in some environments by only
    // creating/aborting a controller when a request actually starts.
    let controller: AbortController | null = null;

    const timeout = setTimeout(() => {
      controller = new AbortController();
      const seq = ++searchSeq.current;
      if (!mountedRef.current) return;

      setSearchLoading(true);

      void (async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller?.signal,
            cache: "no-store",
          });
          if (!res.ok) return;
          const payload = (await res.json()) as SearchResult;
          if (!mountedRef.current) return;
          if (seq !== searchSeq.current) return;
          setResults(payload);
        } catch (error) {
          if ((error as any)?.name === "AbortError") return;
          console.error("[command-bar] Search request failed.", error);
        } finally {
          if (!mountedRef.current) return;
          if (seq === searchSeq.current) setSearchLoading(false);
        }
      })();
    }, 120);

    return () => {
      clearTimeout(timeout);
      try {
        controller?.abort();
      } catch {
        // Ignore any abort-related runtime oddities.
      }
    };
  }, [open, query]);

  const matchingCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    const enabled = commands.filter((c) => c.enabled);
    if (!q) return enabled.slice(0, 8);
    return enabled
      .filter((cmd) => {
        const hay = `${cmd.name} ${cmd.id} ${cmd.description}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 10);
  }, [commands, query]);

  const hasSearchResults =
    results.players.length ||
    results.cases.length ||
    results.reports.length ||
    results.users.length ||
    results.actions.length;

  const shortcutHint = useMemo(() => {
    return isMac() ? "Cmd K" : "Ctrl K";
  }, []);

  function resetCommand() {
    setSelectedCommand(null);
    setFormState({});
    setConfirmRisk(false);
    setStatus({ kind: "idle", message: "" });
  }

  async function runSelectedCommand() {
    if (!selectedCommand) return;
    if (
      (selectedCommand.riskLevel === "MEDIUM" || selectedCommand.riskLevel === "HIGH") &&
      !confirmRisk
    ) {
      setConfirmRisk(true);
      return;
    }

    setCmdLoading(true);
    setStatus({ kind: "idle", message: "" });
    try {
      const result = await runCommandAction(selectedCommand.id as any, formState);
      if (result.status === "pending_approval") {
        setStatus({ kind: "success", message: "Approval requested. Check Inbox for status." });
        return;
      }
      if (result.redirectUrl) {
        setOpen(false);
        resetCommand();
        router.push(result.redirectUrl);
        return;
      }
      setStatus({ kind: "success", message: result.message });
      setTimeout(() => {
        setOpen(false);
        resetCommand();
      }, 350);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Command failed.",
      });
    } finally {
      setCmdLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-tour="command-bar-trigger"
        className="ui-transition relative flex h-8 w-full max-w-[420px] items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-left text-[13px] text-[color:var(--text-muted)] shadow-[var(--panel-shadow)] hover:bg-black/[0.02] dark:hover:bg-white/[0.05]"
        aria-label="Open command bar"
      >
        <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
        <span className="min-w-0 flex-1 truncate">Search or run commands</span>
        <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-1.5 py-0.5 text-[11px] text-[color:var(--text-muted)]">
          {shortcutHint}
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery("");
            setResults(emptyResults);
            resetCommand();
          }
        }}
      >
        <DialogContent className="max-w-[760px] p-0">
          <DialogTitle className="sr-only">Global command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search players, cases, reports, staff activity, and run permission-gated commands.
          </DialogDescription>
          <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[color:var(--text-muted)]" />
              <input
                ref={inputRef}
                data-tour="command-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  selectedCommand
                    ? `Fill inputs for: ${selectedCommand.name}`
                    : "Search players, cases, reports, staff, actions..."
                }
                className="w-full bg-transparent text-[13px] text-[color:var(--text-main)] outline-none placeholder:text-[color:var(--text-muted)]"
              />
            </div>
          </div>

          <div className="grid max-h-[70vh] grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr_320px]">
            <div className="min-h-0 overflow-auto px-2 py-2">
              {!selectedCommand ? (
                <>
                  <Group title="Commands">
                    {matchingCommands.length === 0 ? (
                      <EmptyRow>Type to filter commands.</EmptyRow>
                    ) : (
                      matchingCommands.map((cmd, index) => (
                        <RowButton
                          key={cmd.id}
                          dataTour={index === 0 ? "command-result-first" : undefined}
                          title={cmd.name}
                          subtitle={cmd.description}
                          right={
                            cmd.riskLevel === "HIGH" ? (
                              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
                                HIGH
                              </span>
                            ) : cmd.riskLevel === "MEDIUM" ? (
                              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                MED
                              </span>
                            ) : (
                              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--text-muted)]">
                                LOW
                              </span>
                            )
                          }
                          onClick={() => {
                            setSelectedCommand(cmd);
                            setConfirmRisk(false);
                            setStatus({ kind: "idle", message: "" });
                            const initial: Record<string, string> = {};
                            for (const field of cmd.fields) initial[field.name] = "";
                            setFormState(initial);
                          }}
                        />
                      ))
                    )}
                  </Group>

                  <Group title="Search">
                    {searchLoading ? <EmptyRow>Searching...</EmptyRow> : null}
                    {!searchLoading && !hasSearchResults ? (
                      <EmptyRow>
                        {query.trim().length < 2 ? "Type at least 2 characters." : "No results."}
                      </EmptyRow>
                    ) : null}

                    {results.players.map((p) => (
                      <RowButton
                        key={p.id}
                        title={p.name}
                        subtitle={`Player - ${p.status}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/players/${p.id}`);
                        }}
                      />
                    ))}
                    {results.cases.map((c) => (
                      <RowButton
                        key={c.id}
                        title={c.title}
                        subtitle={`Case - ${c.status}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/cases/${c.id}`);
                        }}
                      />
                    ))}
                    {results.reports.map((r) => (
                      <RowButton
                        key={r.id}
                        title={r.summary.slice(0, 90)}
                        subtitle={`Report - ${r.status}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/reports?reportId=${encodeURIComponent(r.id)}`);
                        }}
                      />
                    ))}
                    {results.users.map((u) => (
                      <RowButton
                        key={u.id}
                        title={u.name}
                        subtitle={`Staff - ${u.role} - ${u.email}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/settings`);
                        }}
                      />
                    ))}
                    {results.actions.map((a) => (
                      <RowButton
                        key={a.id}
                        title={`${a.type} - ${a.player.name}`}
                        subtitle={`Action - ${new Date(a.createdAt).toLocaleString()}`}
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/actions`);
                        }}
                      />
                    ))}
                  </Group>
                </>
              ) : (
                <>
                  <Group title="Command Inputs">
                    <div className="space-y-2 px-2 py-1">
                      {selectedCommand.fields.map((field) => (
                        <FieldRow
                          key={field.name}
                          field={field}
                          value={formState[field.name] ?? ""}
                          onChange={(next) =>
                            setFormState((prev) => ({ ...prev, [field.name]: next }))
                          }
                        />
                      ))}
                    </div>
                  </Group>
                </>
              )}
            </div>

            <aside className="min-h-0 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 md:border-l md:border-t-0">
              {!selectedCommand ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                    Command Bar
                  </p>
                  <p className="text-[13px] text-[color:var(--text-muted)]">
                    Use this for fast search and audited staff commands. High-risk commands may
                    require approval.
                  </p>
                  <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3">
                    <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                      Shortcuts
                    </p>
                    <ul className="mt-2 space-y-1 text-[13px] text-[color:var(--text-muted)]">
                      <li className="flex items-center justify-between">
                        <span>Open</span>
                        <span className="font-mono text-xs">{shortcutHint}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Select</span>
                        <span className="font-mono text-xs">Enter</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Close</span>
                        <span className="font-mono text-xs">Esc</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
                        {selectedCommand.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                        {selectedCommand.description}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Back to results"
                      onClick={() => {
                        resetCommand();
                      }}
                    >
                      <CornerDownLeft className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedCommand.riskLevel !== "LOW" ? (
                    <div className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2.5 text-[13px] text-[color:var(--text-muted)]">
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-[color:var(--text-muted)]" />
                      <div>
                        <p className="font-medium text-[color:var(--text-main)]">
                          Confirmation required
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                          {selectedCommand.riskLevel === "HIGH"
                            ? "High-risk commands default to approval (two-person rule) when enabled."
                            : "Medium-risk commands require confirmation."}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {status.kind !== "idle" ? (
                    <div
                      className={cn(
                        "rounded-[var(--radius-control)] border px-3 py-2 text-[13px]",
                        status.kind === "error"
                          ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      )}
                      role="status"
                      aria-live="polite"
                    >
                      {status.message}
                    </div>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        resetCommand();
                      }}
                      disabled={cmdLoading}
                    >
                      Close
                    </Button>

                    <Button
                      variant={confirmRisk ? "destructive" : "primary"}
                      onClick={runSelectedCommand}
                      disabled={cmdLoading}
                    >
                      {cmdLoading ? "Running..." : confirmRisk ? "Confirm & Run" : "Run"}
                    </Button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-2 text-[13px] text-[color:var(--text-muted)]">{children}</p>;
}

function RowButton({
  dataTour,
  title,
  subtitle,
  right,
  onClick,
}: {
  dataTour?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour={dataTour}
      className="ui-transition flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] dark:hover:bg-white/[0.06]"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </button>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: CommandMeta["fields"][number];
  value: string;
  onChange: (next: string) => void;
}) {
  if (field.type === "textarea" || field.type === "multi") {
    return (
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
          {field.label}
        </label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="mt-1 min-h-20"
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
          {field.label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-neutral ui-transition mt-1 h-8 w-full px-3 text-[13px]"
        >
          <option value="">Select...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
        {field.label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        type={field.type === "number" ? "number" : "text"}
        className="mt-1"
      />
    </div>
  );
}
