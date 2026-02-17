"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";

import { approveCommandAction, rejectCommandAction } from "@/app/actions/command-actions";
import {
  createModerationMacroAction,
  deleteModerationMacroAction,
  runModerationQueueAction,
} from "@/app/actions/moderation-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalStorageState, useMediaQuery } from "@/lib/hooks";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

type QueueItemKind = "report" | "case" | "player" | "approval";
type QueueSeverity = "low" | "medium" | "high";

type QueueItem = {
  id: string;
  kind: QueueItemKind;
  title: string;
  summary: string;
  status: string;
  severity: QueueSeverity;
  createdAt: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  href: string;
  meta?: string;
};

type Macro = {
  id: string;
  name: string;
  type: "REPORT_RESOLUTION" | "NOTE" | "WARNING" | "BAN_REASON";
  templateText: string;
  createdAt: string;
};

type ToolsTab = "notes" | "macros" | "history";

export function ModerationDeskClient({
  userId,
  queue,
  macros,
  canManageMacros,
  canApprove,
}: {
  userId: string;
  queue: QueueItem[];
  macros: Macro[];
  canManageMacros: boolean;
  canApprove: boolean;
}) {
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [toolsDesktopOpen, setToolsDesktopOpen] = useLocalStorageState<boolean>(
    "moderation-desk:toolsOpen",
    true,
  );
  const [toolsTab, setToolsTab] = useLocalStorageState<ToolsTab>(
    "moderation-desk:toolsTab",
    "notes",
  );
  const [toolsMobileOpen, setToolsMobileOpen] = useState(false);

  const [typeFilter, setTypeFilter] = useState<"all" | QueueItemKind>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "OPEN" | "IN_REVIEW" | "PENDING" | "WATCHED"
  >("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "mine" | "unassigned">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | QueueSeverity>("all");
  const [selectedId, setSelectedId] = useState<string | null>(queue[0]?.id ?? null);
  const [selectedKind, setSelectedKind] = useState<QueueItemKind | null>(queue[0]?.kind ?? null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [macroType, setMacroType] = useState<Macro["type"]>("REPORT_RESOLUTION");
  const [flash, setFlash] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const toolsOpen = isDesktop ? toolsDesktopOpen : toolsMobileOpen;

  function setToolsOpen(next: boolean) {
    if (isDesktop) {
      setToolsDesktopOpen(next);
    } else {
      setToolsMobileOpen(next);
    }
  }

  useEffect(() => {
    if (isDesktop) return;
    setToolsMobileOpen(false);
  }, [pathname, isDesktop]);

  useEffect(() => {
    if (isDesktop) return;
    setToolsMobileOpen(false);
  }, [selectedId, selectedKind, isDesktop]);

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      if (typeFilter !== "all" && item.kind !== typeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (severityFilter !== "all" && item.severity !== severityFilter) return false;
      if (assignmentFilter === "mine" && item.assignedToUserId !== userId) return false;
      if (assignmentFilter === "unassigned" && item.assignedToUserId) return false;
      return true;
    });
  }, [assignmentFilter, queue, severityFilter, statusFilter, typeFilter, userId]);

  const selected = useMemo(() => {
    if (!selectedId || !selectedKind) return null;
    return (
      filteredQueue.find((item) => item.id === selectedId && item.kind === selectedKind) ?? null
    );
  }, [filteredQueue, selectedId, selectedKind]);

  const bulkTargets = useMemo(() => {
    return filteredQueue.filter(
      (item) =>
        selectedIds[`${item.kind}:${item.id}`] && (item.kind === "report" || item.kind === "case"),
    );
  }, [filteredQueue, selectedIds]);

  const macroOptions = useMemo(
    () => macros.filter((macro) => macro.type === macroType),
    [macroType, macros],
  );

  function toggleSelected(item: QueueItem, checked: boolean) {
    const key = `${item.kind}:${item.id}`;
    setSelectedIds((prev) => ({ ...prev, [key]: checked }));
  }

  function setResponse(result: Awaited<ReturnType<typeof runModerationQueueAction>>) {
    if (result.ok) {
      setFlash({ tone: "ok", text: result.message });
      return;
    }
    setFlash({ tone: "error", text: result.error.message });
  }

  async function runSingle(operation: "assign_to_me" | "in_review" | "resolve") {
    if (!selected || (selected.kind !== "report" && selected.kind !== "case")) return;

    startTransition(async () => {
      const result = await runModerationQueueAction({
        operation,
        items: [{ id: selected.id, kind: selected.kind }],
        reason: reason.trim() ? reason.trim() : undefined,
      });
      setResponse(result);
    });
  }

  async function runBulk(operation: "assign_to_me" | "in_review" | "resolve") {
    if (bulkTargets.length === 0) return;

    startTransition(async () => {
      const result = await runModerationQueueAction({
        operation,
        items: bulkTargets.map((item) => ({ id: item.id, kind: item.kind as "report" | "case" })),
        reason: reason.trim() ? reason.trim() : undefined,
      });
      setResponse(result);
      if (result.ok) setSelectedIds({});
    });
  }

  function applyMacro(templateText: string) {
    setReason(templateText);
    setFlash({ tone: "ok", text: "Macro applied to resolution note." });
    setToolsTab("notes");
  }

  const toolsPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--border)] pb-2">
        <div>
          <p className="text-[12px] font-semibold tracking-tight text-[color:var(--text-main)]">
            Tools
          </p>
          <p className="text-[12px] text-[color:var(--text-muted)]">
            Notes, macros, and quick context.
          </p>
        </div>
        <SegmentedControl
          value={toolsTab}
          onChange={(value) => setToolsTab(value as ToolsTab)}
          ariaLabel="Tools tabs"
          options={[
            { label: "Notes", value: "notes" },
            { label: "Macros", value: "macros" },
            { label: "History", value: "history" },
          ]}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto pt-3">
        {toolsTab === "notes" ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                Resolution note
              </p>
              <textarea
                className="input-neutral mt-2 min-h-[140px] w-full resize-y text-[13px]"
                placeholder={
                  selected
                    ? "Add context for your team (optional)."
                    : "Select an item to add a note."
                }
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
                disabled={!selected}
              />
              <p className="mt-2 text-[12px] text-[color:var(--text-muted)]">
                Tip: Apply a macro to prefill common notes.
              </p>
            </div>
          </div>
        ) : null}

        {toolsTab === "macros" ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                  Macros
                </p>
                <Wand2 className="h-3.5 w-3.5 text-[color:var(--text-muted)]" />
              </div>
              <div className="mt-2 space-y-2">
                <Select
                  value={macroType}
                  onValueChange={(value) => setMacroType(value as Macro["type"])}
                >
                  <SelectTrigger className="h-7">
                    <SelectValue placeholder="Macro type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPORT_RESOLUTION">Report resolution</SelectItem>
                    <SelectItem value="NOTE">Notes</SelectItem>
                    <SelectItem value="WARNING">Warnings</SelectItem>
                    <SelectItem value="BAN_REASON">Ban reasons</SelectItem>
                  </SelectContent>
                </Select>

                {macroOptions.length === 0 ? (
                  <p className="rounded-[var(--radius-control)] border border-dashed border-[color:var(--border)] p-2 text-[12px] text-[color:var(--text-muted)]">
                    {canManageMacros
                      ? "No macros in this category yet. Create one below."
                      : "No macros in this category yet. Ask an admin to create one."}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {macroOptions.map((macro) => (
                      <div
                        key={macro.id}
                        className="rounded-[var(--radius-control)] border border-[color:var(--border)] p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-[12px] font-medium text-[color:var(--text-main)]">
                            {macro.name}
                          </p>
                          {canManageMacros ? (
                            <button
                              type="button"
                              className="text-[11px] text-rose-600 hover:underline dark:text-rose-300"
                              onClick={() =>
                                startTransition(async () => {
                                  const result = await deleteModerationMacroAction(macro.id);
                                  if (!result.ok) {
                                    setFlash({ tone: "error", text: result.error.message });
                                    return;
                                  }
                                  setFlash({ tone: "ok", text: result.message });
                                })
                              }
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[12px] text-[color:var(--text-muted)]">
                          {macro.templateText}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1.5 h-6 px-1.5 text-[11px]"
                          onClick={() => applyMacro(macro.templateText)}
                        >
                          Apply
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {canManageMacros ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(async () => {
                    const result = await createModerationMacroAction(formData);
                    if (!result.ok) {
                      setFlash({ tone: "error", text: result.error.message });
                      return;
                    }
                    setFlash({ tone: "ok", text: result.message });
                    event.currentTarget.reset();
                  });
                }}
                className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3"
              >
                <p className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  New macro
                </p>
                <input
                  name="name"
                  placeholder="Macro name"
                  className="input-neutral h-8 w-full text-[13px]"
                  required
                />
                <Select name="type" defaultValue={macroType}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REPORT_RESOLUTION">Report resolution</SelectItem>
                    <SelectItem value="NOTE">Notes</SelectItem>
                    <SelectItem value="WARNING">Warnings</SelectItem>
                    <SelectItem value="BAN_REASON">Ban reasons</SelectItem>
                  </SelectContent>
                </Select>
                <textarea
                  name="templateText"
                  placeholder="Template text"
                  className="input-neutral min-h-[84px] w-full text-[13px]"
                  required
                />
                <Button type="submit" size="sm" variant="primary" disabled={pending}>
                  Save macro
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}

        {toolsTab === "history" ? (
          <div className="space-y-3">
            {selected ? (
              <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                  Context
                </p>
                <dl className="mt-2 grid gap-1.5 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-muted)]">Type</dt>
                    <dd className="text-[color:var(--text-main)]">{selected.kind.toUpperCase()}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-muted)]">Status</dt>
                    <dd className="text-[color:var(--text-main)]">{selected.status}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-muted)]">Severity</dt>
                    <dd className="text-[color:var(--text-main)]">{selected.severity}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-muted)]">Created</dt>
                    <dd className="text-[color:var(--text-main)]">
                      {formatDateTime(new Date(selected.createdAt))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-muted)]">Assigned</dt>
                    <dd className="text-[color:var(--text-main)]">
                      {selected.assignedToName ?? "Unassigned"}
                    </dd>
                  </div>
                </dl>
                {selected.meta ? (
                  <p className="mt-3 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-2 text-[12px] text-[color:var(--text-muted)]">
                    {selected.meta}
                  </p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link href={selected.href}>
                    Open full view <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-[var(--radius-panel)] border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-[12px] text-[color:var(--text-muted)]">
                Select an item from the queue to view details.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const flashBanner = flash ? (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-control)] border p-2 text-[12px]",
        flash.tone === "ok"
          ? "border-emerald-400/40 bg-emerald-400/12 text-emerald-700 dark:text-emerald-300"
          : "border-rose-400/45 bg-rose-400/12 text-rose-700 dark:text-rose-300",
      )}
    >
      {flash.tone === "ok" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{flash.text}</span>
    </div>
  ) : null;

  return (
    <section className="ui-transition group overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--panel-shadow)] backdrop-blur-lg">
      <header className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
              Moderation Desk
            </h2>
            <p className="mt-0.5 text-[12px] text-[color:var(--text-muted)]">
              Unified queue and operator workflow for reports, cases, approvals, and flagged
              players.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
            >
              <SelectTrigger className="h-7 min-w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="case">Cases</SelectItem>
                <SelectItem value="player">Flagged players</SelectItem>
                <SelectItem value="approval">Approvals</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="h-7 min-w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In review</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="WATCHED">Watched</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={assignmentFilter}
              onValueChange={(value) => setAssignmentFilter(value as typeof assignmentFilter)}
            >
              <SelectTrigger className="h-7 min-w-[130px]">
                <SelectValue placeholder="Assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignment</SelectItem>
                <SelectItem value="mine">Assigned to me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(value) => setSeverityFilter(value as typeof severityFilter)}
            >
              <SelectTrigger className="h-7 min-w-[120px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant={toolsOpen ? "outline" : "ghost"}
              onClick={() => setToolsOpen(!toolsOpen)}
              aria-label={toolsOpen ? "Hide tools panel" : "Show tools panel"}
              title={toolsOpen ? "Hide tools" : "Show tools"}
            >
              {toolsOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Tools</span>
            </Button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid min-h-[560px] grid-cols-1",
          toolsDesktopOpen
            ? "lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)_340px]"
            : "lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]",
        )}
      >
        <div className="min-h-0 min-w-0 bg-[color:var(--surface)] lg:border-r lg:border-[color:var(--border)]">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-3 py-2">
              <p className="text-[12px] text-[color:var(--text-muted)]">
                Queue items:{" "}
                <span className="font-semibold text-[color:var(--text-main)]">
                  {filteredQueue.length}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || bulkTargets.length === 0}
                  onClick={() => runBulk("assign_to_me")}
                >
                  Assign to me
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || bulkTargets.length === 0}
                  onClick={() => runBulk("in_review")}
                >
                  In review
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={pending || bulkTargets.length === 0}
                  onClick={() => runBulk("resolve")}
                >
                  Resolve
                </Button>
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <ShieldAlert className="h-8 w-8 text-[color:var(--text-muted)]" />
                <p className="mt-2 text-[14px] font-medium text-[color:var(--text-main)]">
                  Queue is clear.
                </p>
                <p className="mt-1 max-w-sm text-[13px] text-[color:var(--text-muted)]">
                  Assign reports and cases to yourself, then use macros to keep responses
                  consistent.
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]/95 backdrop-blur">
                    <TableRow>
                      <TableHead className="w-8">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((item) => {
                      const key = `${item.kind}:${item.id}`;
                      const selectedRow = selectedId === item.id && selectedKind === item.kind;
                      const selectable = item.kind === "report" || item.kind === "case";
                      return (
                        <TableRow
                          key={key}
                          className={cn(selectedRow && "bg-black/[0.04] dark:bg-white/[0.08]")}
                          onClick={() => {
                            setSelectedId(item.id);
                            setSelectedKind(item.kind);
                            setMacroType(item.kind === "report" ? "REPORT_RESOLUTION" : "NOTE");
                          }}
                        >
                          <TableCell onClick={(event) => event.stopPropagation()}>
                            {selectable ? (
                              <Checkbox
                                checked={Boolean(selectedIds[key])}
                                onCheckedChange={(checked) =>
                                  toggleSelected(item, checked === true)
                                }
                                aria-label={`Select ${item.kind} ${item.title}`}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="line-clamp-1 text-[13px] font-medium text-[color:var(--text-main)]">
                                {item.title}
                              </p>
                              <p className="line-clamp-1 text-[12px] text-[color:var(--text-muted)]">
                                {item.kind.toUpperCase()} - {item.summary}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "OPEN"
                                  ? "warning"
                                  : item.status === "PENDING"
                                    ? "info"
                                    : "default"
                              }
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.severity === "high"
                                  ? "danger"
                                  : item.severity === "medium"
                                    ? "warning"
                                    : "default"
                              }
                            >
                              {item.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[12px] text-[color:var(--text-muted)]">
                            {item.assignedToName ?? "Unassigned"}
                          </TableCell>
                          <TableCell className="text-right text-[12px] text-[color:var(--text-muted)]">
                            {formatRelativeTime(new Date(item.createdAt))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 min-w-0 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] lg:border-t-0">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
            {flashBanner}

            {selected ? (
              <div className="space-y-3">
                <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-semibold text-[color:var(--text-main)]">
                        {selected.title}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[color:var(--text-muted)]">
                        {selected.kind.toUpperCase()} - {selected.summary}
                      </p>
                      {selected.meta ? (
                        <p className="mt-1 text-[12px] text-[color:var(--text-muted)]">
                          {selected.meta}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="default">{selected.status}</Badge>
                      <Badge
                        variant={
                          selected.severity === "high"
                            ? "danger"
                            : selected.severity === "medium"
                              ? "warning"
                              : "default"
                        }
                      >
                        {selected.severity}
                      </Badge>
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-1.5 text-[12px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[color:var(--text-muted)]">Created</dt>
                      <dd className="text-[color:var(--text-main)]">
                        {formatDateTime(new Date(selected.createdAt))}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[color:var(--text-muted)]">Assigned</dt>
                      <dd className="text-[color:var(--text-main)]">
                        {selected.assignedToName ?? "Unassigned"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Button asChild size="sm" variant="outline">
                      <Link href={selected.href}>
                        Open full view <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setToolsOpen(true);
                        setToolsTab("notes");
                      }}
                    >
                      Open notes
                    </Button>
                  </div>
                </div>

                {selected.kind === "report" || selected.kind === "case" ? (
                  <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                      Quick actions
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => runSingle("assign_to_me")}
                      >
                        Assign to me
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => runSingle("in_review")}
                      >
                        Mark in review
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={pending}
                        onClick={() => runSingle("resolve")}
                      >
                        Resolve with note
                      </Button>
                    </div>
                  </div>
                ) : null}

                {selected.kind === "approval" ? (
                  <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                      Approval actions
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {canApprove ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const result = await approveCommandAction(selected.id);
                                if (result.status === "executed") {
                                  setFlash({ tone: "ok", text: "Approval executed." });
                                } else {
                                  setFlash({
                                    tone: "error",
                                    text: "Approval could not be executed.",
                                  });
                                }
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await rejectCommandAction(
                                  selected.id,
                                  "Rejected from Moderation Desk.",
                                );
                                setFlash({ tone: "ok", text: "Approval rejected." });
                              })
                            }
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <p className="text-[12px] text-[color:var(--text-muted)]">
                          You can review approvals but cannot decide them.
                        </p>
                      )}

                      <Button asChild size="sm" variant="ghost">
                        <Link href="/app/inbox">
                          Open inbox <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-[13px] text-[color:var(--text-muted)]">
                  Select an item from the queue.
                </p>
              </div>
            )}
          </div>
        </div>

        {isDesktop && toolsDesktopOpen ? (
          <aside className="min-h-0 min-w-0 border-t border-[color:var(--border)] bg-[color:var(--surface-muted)] lg:border-l lg:border-t-0">
            <div className="h-full min-h-0 p-3">{toolsPanel}</div>
          </aside>
        ) : null}
      </div>

      <Sheet open={toolsMobileOpen} onOpenChange={setToolsMobileOpen}>
        <SheetContent side="right" className="p-3">
          {toolsPanel}
        </SheetContent>
      </Sheet>
    </section>
  );
}
