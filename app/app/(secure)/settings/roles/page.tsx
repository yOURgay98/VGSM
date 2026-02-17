import Link from "next/link";

import { RoleCreateDialog } from "@/components/settings/roles/role-create-dialog";
import { RoleInspector } from "@/components/settings/roles/role-inspector";
import { ConsoleLayout } from "@/components/layout/utility/console-layout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function RolesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ roleId?: string }>;
}) {
  const actor = await requirePermission(Permission.USERS_EDIT_ROLE);
  const { roleId } = await searchParams;

  const roles = await prisma.communityRole.findMany({
    where: { communityId: actor.communityId },
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { memberships: true } },
    },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });

  const selectedId = roleId && roles.some((r) => r.id === roleId) ? roleId : null;
  const selected = selectedId
    ? await prisma.communityRole.findFirst({
        where: { id: selectedId, communityId: actor.communityId },
        include: {
          permissions: { select: { permission: true } },
          memberships: {
            take: 8,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true } } },
          },
          _count: { select: { memberships: true } },
        },
      })
    : null;

  return (
    <ConsoleLayout
      storageKey="settings:roles"
      title="Roles"
      toolbar={
        <RoleCreateDialog
          actorPermissions={actor.permissions}
          actorRolePriority={actor.membership.role.priority}
        />
      }
      list={
        <div className="h-full min-h-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-strong)]">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => {
                const active = r.id === selectedId;
                return (
                  <TableRow
                    key={r.id}
                    className={active ? "bg-white/70 dark:bg-white/[0.08]" : undefined}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/settings/roles?roleId=${encodeURIComponent(r.id)}`}
                        className="ui-transition block rounded-md hover:underline"
                      >
                        {r.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">{r.priority}</TableCell>
                    <TableCell>
                      <Badge variant={r.isSystemDefault ? "default" : "info"}>
                        {r.isSystemDefault ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {r._count.memberships}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {r.permissions.length}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      }
      inspector={
        selected ? (
          <RoleInspector
            role={{
              id: selected.id,
              name: selected.name,
              description: selected.description ?? null,
              priority: selected.priority,
              isSystemDefault: selected.isSystemDefault,
              permissions: selected.permissions.map((p) => p.permission),
              memberCount: selected._count.memberships,
              membersPreview: selected.memberships.map((m) => ({
                userId: m.userId,
                name: m.user.name,
              })),
            }}
            actorPermissions={actor.permissions}
            actorRolePriority={actor.membership.role.priority}
          />
        ) : null
      }
      inspectorEmpty={
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">No role selected</p>
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Select a role to inspect permissions, priority, and membership.
          </p>
        </div>
      }
    />
  );
}
