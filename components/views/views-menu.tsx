"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SavedViewScope } from "@prisma/client";
import { Bookmark } from "lucide-react";

import { deleteViewAction, saveViewAction } from "@/app/actions/view-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ViewRow = {
  id: string;
  name: string;
  filtersJson: unknown;
};

function stringifyFilters(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim() !== "") {
      out[k] = v;
    }
  }
  return out;
}

export function ViewsMenu({
  scope,
  views,
  currentFilters,
  clearKeysOnApply,
}: {
  scope: SavedViewScope;
  views: ViewRow[];
  currentFilters: Record<string, string>;
  clearKeysOnApply?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const normalizedViews = useMemo(
    () =>
      views.map((v) => ({
        id: v.id,
        name: v.name,
        filters: stringifyFilters(v.filtersJson),
      })),
    [views],
  );

  function applyFilters(filters: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (!v) continue;
      params.set(k, v);
    }
    for (const key of clearKeysOnApply ?? []) {
      params.delete(key);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    router.refresh();
  }

  async function onSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await saveViewAction(scope, trimmed, currentFilters);
  }

  async function onDelete(viewId: string) {
    await deleteViewAction(scope, viewId);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label="Saved views">
            <Bookmark className="h-4 w-4" />
            Views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {normalizedViews.length === 0 ? (
            <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
          ) : (
            normalizedViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onClick={() => applyFilters(view.filters)}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{view.name}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            Save current view...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[520px] p-0">
          <DialogTitle className="sr-only">Saved views</DialogTitle>
          <DialogDescription className="sr-only">
            Save, apply, and remove view presets for this page.
          </DialogDescription>
          <div className="border-b border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Saved Views</p>
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
              Save and re-apply common filter configurations.
            </p>
          </div>

          <div className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="View name"
              />
              <Button
                variant="primary"
                disabled={pending || name.trim().length === 0}
                onClick={() => {
                  startTransition(async () => {
                    await onSave();
                    setName("");
                    router.refresh();
                  });
                }}
              >
                Save
              </Button>
            </div>

            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
              {normalizedViews.length === 0 ? (
                <p className="px-3 py-3 text-[13px] text-[color:var(--text-muted)]">
                  No saved views yet.
                </p>
              ) : (
                <div className="divide-y divide-[color:var(--border)]">
                  {normalizedViews.map((view) => (
                    <div
                      key={view.id}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                          {view.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[color:var(--text-muted)]">
                          {Object.keys(view.filters).length
                            ? JSON.stringify(view.filters)
                            : "No filters"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyFilters(view.filters)}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={cn("text-rose-600 dark:text-rose-300")}
                          onClick={() => {
                            startTransition(async () => {
                              await onDelete(view.id);
                              router.refresh();
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
