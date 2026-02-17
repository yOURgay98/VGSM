import { InboxTable } from "@/components/inbox/inbox-table";
import { MacWindow } from "@/components/layout/mac-window";
import { requirePermission } from "@/lib/services/auth";
import { listInbox } from "@/lib/services/inbox";
import { Permission } from "@/lib/security/permissions";
import { formatDateTime } from "@/lib/utils";

type InboxRow =
  | {
      kind: "report";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    }
  | {
      kind: "case";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    }
  | {
      kind: "approval";
      id: string;
      title: string;
      status: string;
      createdAtLabel: string;
      href: string;
      meta: string;
    };

export default async function InboxPage() {
  const user = await requirePermission(Permission.REPORTS_TRIAGE);
  const { reports, cases, approvals } = await listInbox({ communityId: user.communityId });

  const rows: InboxRow[] = [
    ...approvals.map((a) => {
      const payload = a.payloadJson as any;
      const kind = typeof payload?.kind === "string" ? payload.kind : null;
      const commandId = typeof payload?.commandId === "string" ? payload.commandId : null;
      const title =
        kind === "invite.join" ? "Approval: Invite access" : `Approval: ${commandId ?? "unknown"}`;
      return {
        kind: "approval",
        id: a.id,
        title,
        status: a.riskLevel,
        createdAtLabel: formatDateTime(a.createdAt),
        href: "/app/inbox",
        meta: `Requested by ${a.requestedByUser?.name ?? "Unknown"}`,
      } as const;
    }),
    ...reports.map((r) => ({
      kind: "report" as const,
      id: r.id,
      title: r.summary,
      status: r.status,
      createdAtLabel: formatDateTime(r.createdAt),
      href: `/app/reports?reportId=${encodeURIComponent(r.id)}`,
      meta: r.accusedPlayer ? `Accused: ${r.accusedPlayer.name}` : "Accused: Unknown",
    })),
    ...cases.map((c) => ({
      kind: "case" as const,
      id: c.id,
      title: c.title,
      status: c.status,
      createdAtLabel: formatDateTime(c.createdAt),
      href: `/app/cases/${c.id}`,
      meta: `${c.casePlayers.length} players - ${c.reports.length} reports`,
    })),
  ];

  return (
    <div className="space-y-2" data-tour="inbox-triage">
      <MacWindow title="Inbox" subtitle="Triage reports, unassigned cases, and approval requests">
        <InboxTable rows={rows} />
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          Tip: Use Cmd/Ctrl+K to run commands. High-risk commands will appear here when approval is
          required.
        </p>
      </MacWindow>
    </div>
  );
}
