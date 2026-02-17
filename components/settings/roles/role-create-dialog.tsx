"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createCommunityRoleAction } from "@/app/actions/community-role-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  PERMISSION_GROUPS,
  OWNER_ONLY_PERMISSIONS,
  formatPermissionLabel,
} from "@/lib/security/permission-groups";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string; roleId?: string };

export function RoleCreateDialog({
  actorPermissions,
  actorRolePriority,
}: {
  actorPermissions: readonly string[];
  actorRolePriority: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [state, action] = useFormState<Result>(createCommunityRoleAction as any, {
    ok: true,
    message: "",
    roleId: undefined,
  });

  useEffect(() => {
    if (!open) return;
    if (!state?.ok) return;
    if (!state.roleId) return;
    setOpen(false);
    router.push(`/app/settings/roles?roleId=${encodeURIComponent(state.roleId)}`);
    router.refresh();
  }, [open, router, state]);

  const canGrant = useMemo(() => new Set(actorPermissions), [actorPermissions]);
  const isOwner = actorRolePriority >= ROLE_PRIORITY.OWNER;
  const filteredGroups = useMemo(() => {
    const q = permissionFilter.trim().toLowerCase();
    if (!q) return PERMISSION_GROUPS;
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter((perm) => {
        const label = formatPermissionLabel(perm).toLowerCase();
        return label.includes(q) || perm.toLowerCase().includes(q);
      }),
    })).filter((group) => group.permissions.length > 0);
  }, [permissionFilter]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          New Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[86vh] max-w-[920px] overflow-hidden p-0">
        <DialogHeader>
          <div className="border-b border-[color:var(--border)] px-5 py-4">
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              Create a custom role for this community and assign scoped permissions.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form action={action} className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label
                  className="text-[13px] font-medium text-[color:var(--text-main)]"
                  htmlFor="role-name"
                >
                  Name
                </label>
                <Input
                  id="role-name"
                  name="name"
                  className="mt-1 h-9"
                  placeholder="e.g. Senior Moderator"
                  required
                />
              </div>
              <div>
                <label
                  className="text-[13px] font-medium text-[color:var(--text-main)]"
                  htmlFor="role-priority"
                >
                  Priority
                </label>
                <Input
                  id="role-priority"
                  name="priority"
                  type="number"
                  min={1}
                  max={ROLE_PRIORITY.OWNER}
                  defaultValue={ROLE_PRIORITY.TRIAL_MOD}
                  className="mt-1 h-9"
                  required
                />
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  Higher priority means more privilege. Owner is {ROLE_PRIORITY.OWNER}.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <label
                className="text-[13px] font-medium text-[color:var(--text-main)]"
                htmlFor="role-desc"
              >
                Description
              </label>
              <Input
                id="role-desc"
                name="description"
                className="mt-1 h-9"
                placeholder="Optional"
              />
            </div>

            <div className="mt-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
              <div className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)]/95 p-3 backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
                    Permissions
                  </p>
                  <p className="text-xs text-[color:var(--text-muted)]">
                    Only permissions you hold can be granted.
                  </p>
                </div>
                <Input
                  value={permissionFilter}
                  onChange={(event) => setPermissionFilter(event.target.value)}
                  placeholder="Filter permissions..."
                  className="h-8"
                />
              </div>

              <div className="max-h-[52vh] overflow-auto p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                        {group.label}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {group.permissions.map((perm) => {
                          const disabled =
                            !canGrant.has(perm) ||
                            (!isOwner && OWNER_ONLY_PERMISSIONS.includes(perm));
                          return (
                            <label
                              key={perm}
                              className={cn(
                                "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1 text-[13px] ui-transition hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
                                disabled &&
                                  "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent",
                              )}
                            >
                              <span
                                className={
                                  OWNER_ONLY_PERMISSIONS.includes(perm)
                                    ? "text-rose-600 dark:text-rose-300"
                                    : undefined
                                }
                              >
                                {formatPermissionLabel(perm)}
                              </span>
                              <input
                                type="checkbox"
                                name="permissions"
                                value={perm}
                                disabled={disabled}
                                className="h-4 w-4 accent-[color:var(--accent)]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredGroups.length === 0 ? (
                  <p className="text-[13px] text-[color:var(--text-muted)]">
                    No permissions match this filter.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-3">
            {state?.message ? (
              <p
                className={cn(
                  "mb-2 text-[13px]",
                  state.ok
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-rose-600 dark:text-rose-300",
                )}
              >
                {state.message}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
