import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { listModerationDesk } from "@/lib/services/moderation";
import { ModerationDeskClient } from "@/components/moderation/moderation-desk-client";

type QueueSeverity = "low" | "medium" | "high";

function reportSeverity(status: string): QueueSeverity {
  if (status === "OPEN") return "high";
  if (status === "IN_REVIEW") return "medium";
  return "low";
}

function caseSeverity(status: string): QueueSeverity {
  if (status === "OPEN") return "high";
  if (status === "IN_REVIEW") return "medium";
  return "low";
}

export default async function ModerationDeskPage() {
  const user = await requirePermission(Permission.REPORTS_READ);
  const data = await listModerationDesk({ communityId: user.communityId });

  const queue = [
    ...data.reports.map((report) => ({
      id: report.id,
      kind: "report" as const,
      title: report.summary,
      summary: report.accusedPlayer?.name
        ? `Accused: ${report.accusedPlayer.name}`
        : "Accused: unknown",
      status: report.status,
      severity: reportSeverity(report.status),
      createdAt: report.createdAt.toISOString(),
      assignedToUserId: report.assignedToUserId,
      assignedToName: report.assignedToUser?.name ?? null,
      href: `/app/reports?reportId=${encodeURIComponent(report.id)}`,
      meta: report.case ? `Linked case: ${report.case.title}` : undefined,
    })),
    ...data.cases.map((entry) => ({
      id: entry.id,
      kind: "case" as const,
      title: entry.title,
      summary:
        entry.casePlayers.length > 0
          ? `Players: ${entry.casePlayers.map((p) => p.player.name).join(", ")}`
          : "No players linked yet",
      status: entry.status,
      severity: caseSeverity(entry.status),
      createdAt: entry.createdAt.toISOString(),
      assignedToUserId: entry.assignedToUserId,
      assignedToName: entry.assignedToUser?.name ?? null,
      href: `/app/cases/${entry.id}`,
      meta: `${entry.reports.length} linked reports`,
    })),
    ...data.flaggedPlayers.map((player) => ({
      id: player.id,
      kind: "player" as const,
      title: player.name,
      summary: player.actions[0]?.reason ?? "Flagged for active monitoring",
      status: player.status,
      severity: "medium" as const,
      createdAt: player.updatedAt.toISOString(),
      assignedToUserId: null,
      assignedToName: null,
      href: `/app/players/${player.id}`,
      meta: player.actions[0] ? `Latest: ${player.actions[0].type}` : "No actions recorded",
    })),
    ...data.approvals.map((approval) => {
      const payload = approval.payloadJson as Record<string, unknown> | null;
      const commandId =
        payload && typeof payload.commandId === "string" ? payload.commandId : "command";
      return {
        id: approval.id,
        kind: "approval" as const,
        title: `Approval: ${commandId}`,
        summary: `Requested by ${approval.requestedByUser?.name ?? "Unknown staff"}`,
        status: approval.status,
        severity:
          approval.riskLevel === "HIGH"
            ? ("high" as const)
            : approval.riskLevel === "MEDIUM"
              ? ("medium" as const)
              : ("low" as const),
        createdAt: approval.createdAt.toISOString(),
        assignedToUserId: approval.requestedByUser?.id ?? null,
        assignedToName: approval.requestedByUser?.name ?? null,
        href: "/app/inbox",
        meta: `Risk: ${approval.riskLevel}`,
      };
    }),
  ].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 } as const;
    const diff = rank[a.severity] - rank[b.severity];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-2" data-tour="moderation-desk">
      <ModerationDeskClient
        userId={user.id}
        queue={queue}
        macros={data.macros.map((macro) => ({
          id: macro.id,
          name: macro.name,
          type: macro.type,
          templateText: macro.templateText,
          createdAt: macro.createdAt.toISOString(),
        }))}
        canManageMacros={user.permissions.includes(Permission.SETTINGS_EDIT)}
        canApprove={user.permissions.includes(Permission.APPROVALS_DECIDE)}
      />
    </div>
  );
}
