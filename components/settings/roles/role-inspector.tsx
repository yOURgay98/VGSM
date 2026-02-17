"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { Copy, Download, Trash2 } from "lucide-react";

import {
  cloneCommunityRoleAction,
  deleteCommunityRoleAction,
  updateCommunityRoleAction,
} from "@/app/actions/community-role-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import {
  PERMISSION_GROUPS,
  OWNER_ONLY_PERMISSIONS,
  formatPermissionLabel,
} from "@/lib/security/permission-groups";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string; roleId?: string };

export function RoleInspector({
  role,
  actorPermissions,
  actorRolePriority,
}: {
  role: {
    id: string;
    name: string;
    description: string | null;
    priority: number;
    isSystemDefault: boolean;
    permissions: string[];
    memberCount: number;
    membersPreview: Array<{ userId: string; name: string }>;
  };
  actorPermissions: readonly string[];
  actorRolePriority: number;
}) {
  const router = useRouter();
  const [deletePending, startDelete] = useTransition();
  const [clonePending, startClone] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [state, action] = useFormState<Result>(
    updateCommunityRoleAction.bind(null, role.id) as any,
    {
      ok: true,
      message: "",
      roleId: role.id,
    },
  );

  useEffect(() => {
    setConfirmDelete(false);
  }, [role.id]);

  const canGrant = useMemo(() => new Set(actorPermissions), [actorPermissions]);
  const selected = useMemo(() => new Set(role.permissions), [role.permissions]);
  const isOwner = actorRolePriority >= ROLE_PRIORITY.OWNER;
  const filterValue = permissionFilter.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!filterValue) return PERMISSION_GROUPS;
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (perm) =>
          formatPermissionLabel(perm).toLowerCase().includes(filterValue) ||
          perm.toLowerCase().includes(filterValue),
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [filterValue]);

  const canDelete = !role.isSystemDefault && role.memberCount === 0;

  return (
    <div className="space-y-3">
      <MacWindow
        title={role.name}
        subtitle={role.isSystemDefault ? "System role" : "Custom role"}
        className="bg-[color:var(--surface-strong)]"
        contentClassName="space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={role.isSystemDefault ? "default" : "info"}>
              {role.isSystemDefault ? "System" : "Custom"}
            </Badge>
            <Badge variant="default">Priority {role.priority}</Badge>
            <Badge variant="default">
              {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!role.isSystemDefault ? (
              <Button
                size="sm"
                variant="outline"
                disabled={clonePending}
                onClick={() => {
                  startClone(async () => {
                    const result = await cloneCommunityRoleAction(role.id);
                    if (result.ok && result.roleId) {
                      router.push(
                        `/app/settings/roles?roleId=${encodeURIComponent(result.roleId)}`,
                      );
                      router.refresh();
                    }
                  });
                }}
              >
                <Copy className="mr-1.5 h-4 w-4" />
                Clone
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const exportPayload = {
                  name: role.name,
                  description: role.description,
                  priority: role.priority,
                  permissions: role.permissions,
                };
                const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
                  type: "application/json",
                });
                const href = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = href;
                anchor.download = `${role.name.toLowerCase().replace(/\\s+/g, "-")}-role.json`;
                anchor.click();
                URL.revokeObjectURL(href);
              }}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            {canDelete ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={deletePending}
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete role"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        {confirmDelete ? (
          <div className="rounded-[var(--radius-panel)] border border-rose-500/30 bg-rose-500/10 p-2">
            <p className="text-[13px] font-medium text-rose-700 dark:text-rose-200">
              Delete this role?
            </p>
            <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-200/80">
              This cannot be undone. Roles with members cannot be deleted.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deletePending}
                onClick={() => {
                  startDelete(async () => {
                    try {
                      await deleteCommunityRoleAction(role.id);
                      router.push("/app/settings/roles");
                      router.refresh();
                    } catch (err) {
                      console.error("[roles] delete failed", err);
                    }
                  });
                }}
              >
                Confirm delete
              </Button>
            </div>
          </div>
        ) : null}

        <form action={action} className="space-y-3">
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
                defaultValue={role.name}
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
                defaultValue={role.priority}
                className="mt-1 h-9"
                required
              />
            </div>
          </div>

          <div>
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
              defaultValue={role.description ?? ""}
            />
          </div>

          <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
            <div className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--surface-muted)]/95 p-3 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
                  Permissions
                </p>
                <p className="text-xs text-[color:var(--text-muted)]">
                  High-risk permissions require Sensitive Mode.
                </p>
              </div>
              <Input
                value={permissionFilter}
                onChange={(event) => setPermissionFilter(event.target.value)}
                placeholder="Filter permissions..."
                className="mt-2 h-8"
              />
            </div>

            <div className="max-h-[54vh] overflow-auto p-3">
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
                              defaultChecked={selected.has(perm)}
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
                <p className="mt-3 text-[13px] text-[color:var(--text-muted)]">
                  No permissions match this filter.
                </p>
              ) : null}
            </div>
          </div>

          {state?.message ? (
            <p
              className={cn(
                "text-[13px]",
                state.ok
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-rose-600 dark:text-rose-300",
              )}
            >
              {state.message}
            </p>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-3 border-t border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 px-3 py-2 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" size="sm">
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </MacWindow>

      <MacWindow title="Members" subtitle="Community members assigned to this role">
        {role.memberCount === 0 ? (
          <p className="text-[13px] text-[color:var(--text-muted)]">No members assigned.</p>
        ) : (
          <ul className="space-y-1.5">
            {role.membersPreview.map((m) => (
              <li
                key={m.userId}
                className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-2 text-[13px] text-[color:var(--text-main)]"
              >
                {m.name}
              </li>
            ))}
            {role.memberCount > role.membersPreview.length ? (
              <li className="text-xs text-[color:var(--text-muted)]">
                Showing {role.membersPreview.length} of {role.memberCount}.
              </li>
            ) : null}
          </ul>
        )}
      </MacWindow>
    </div>
  );
}
