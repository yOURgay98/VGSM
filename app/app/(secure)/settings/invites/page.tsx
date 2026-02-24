import { CreateInviteForm } from "@/components/forms/create-invite-form";
import { InviteTemplateDialog } from "@/components/settings/invites/invite-template-dialog";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";
import { listInvites, listInviteTemplates } from "@/lib/services/invite";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { deleteInviteTemplateAction } from "@/app/actions/invite-template-actions";
import { revokeInviteAction } from "@/app/actions/invite-actions";

export default async function InvitesSettingsPage() {
  const actor = await requirePermission(Permission.USERS_INVITE);

  const [roles, templates, invites] = await Promise.all([
    prisma.communityRole.findMany({
      where: { communityId: actor.communityId },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      select: { id: true, name: true, priority: true, isSystemDefault: true },
    }),
    listInviteTemplates({ communityId: actor.communityId }),
    listInvites({ communityId: actor.communityId }),
  ]);

  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.defaultRole?.name ?? "Role"})`,
    defaultRoleName: t.defaultRole?.name ?? null,
    expiresInMinutes: t.expiresInMinutes ?? null,
    maxUses: t.maxUses ?? null,
    require2fa: t.require2fa,
    requireApproval: t.requireApproval,
  }));

  return (
    <div className="space-y-3">
      <MacWindow
        title="Invite Templates"
        subtitle="Reusable invite policies (default role, expiry rules, max uses, 2FA and approval requirements)"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <InviteTemplateDialog roles={roles.map((r) => ({ id: r.id, name: r.name }))} />
          <p className="text-xs text-[color:var(--text-muted)]">
            Templates are scoped to this community.
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Default Role</TableHead>
                <TableHead>Expires In</TableHead>
                <TableHead>Max Uses</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No templates yet.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {t.defaultRole?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {t.expiresInMinutes ? `${t.expiresInMinutes}m` : "-"}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {t.maxUses ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.require2fa ? "warning" : "default"}>
                        {t.require2fa ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.requireApproval ? "warning" : "default"}>
                        {t.requireApproval ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {formatDateTime(t.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteInviteTemplateAction.bind(null, t.id)}>
                        <button
                          type="submit"
                          className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] px-2.5 py-1 text-[13px] text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                        >
                          Delete
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </MacWindow>

      <MacWindow title="Create Invite" subtitle="Generate scoped invite links for staff accounts">
        <CreateInviteForm roleOptions={roleOptions} templateOptions={templateOptions} />
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          Invites can be redeemed at{" "}
          <code className="rounded-md border border-[color:var(--border)] bg-black/5 px-1.5 py-0.5 text-[11px] dark:bg-white/[0.06]">
            /invite/&lt;token&gt;
          </code>
          .
        </p>
      </MacWindow>

      <MacWindow title="Active Invites" subtitle="Issued invite links and usage status">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No invites issued.
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.tokenPreview}</TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {i.role?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {i.template?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {i.uses}/{i.maxUses}
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {i.expiresAt ? formatDateTime(i.expiresAt) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={i.require2fa ? "warning" : "default"}>
                        {i.require2fa ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={i.requireApproval ? "warning" : "default"}>
                        {i.requireApproval ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[color:var(--text-muted)]">
                      {formatDateTime(i.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {i.revokedAt ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : (
                        <form action={revokeInviteAction.bind(null, i.id)}>
                          <button
                            type="submit"
                            className="ui-transition rounded-[var(--radius-control)] border border-[color:var(--border)] px-2.5 py-1 text-[13px] text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                          >
                            Revoke
                          </button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          For security, invite tokens are only shown once at creation. The token column shows a
          non-redeemable preview.
        </p>
      </MacWindow>
    </div>
  );
}
