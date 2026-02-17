import {
  ActionType,
  ApprovalStatus,
  CaseStatus,
  Prisma,
  ReportStatus,
  RiskLevel,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCommandDefinition } from "@/lib/commands/registry";
import type { CommandId, CommandRunResult } from "@/lib/commands/types";
import { authorize } from "@/lib/security/authorize";
import type { Permission as PermissionType } from "@/lib/security/permissions";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getCommunityAuthContext } from "@/lib/services/community";
import { getSecuritySettings } from "@/lib/services/security-settings";
import {
  createSecurityEvent,
  maybeRecordApprovalSpam,
  maybeRecordHighRiskCommandBurst,
} from "@/lib/services/security-events";

type Actor = { id: string; disabledAt: Date | null; permissions: readonly PermissionType[] };

async function requirePlayerInCommunity(
  tx: Prisma.TransactionClient,
  input: { communityId: string; playerId: string; actorUserId: string },
) {
  const player = await tx.player.findUnique({
    where: { id: input.playerId },
    select: { id: true, communityId: true },
  });

  if (!player) {
    throw new Error("Player not found.");
  }

  if (player.communityId !== input.communityId) {
    await createAuditLog({
      communityId: input.communityId,
      userId: input.actorUserId,
      eventType: AuditEvent.TENANT_VIOLATION,
      metadata: {
        operation: "write",
        resource: "player",
        resourceId: input.playerId,
        resourceCommunityId: player.communityId,
      },
    });
    await createSecurityEvent({
      communityId: input.communityId,
      userId: input.actorUserId,
      severity: "CRITICAL",
      eventType: "cross_tenant_access_attempt",
      metadata: {
        operation: "write",
        resource: "player",
        resourceId: input.playerId,
        resourceCommunityId: player.communityId,
      } as unknown as Prisma.InputJsonValue,
    });
    throw new Error("Player not found.");
  }

  return player;
}

async function requireActionInCommunity(
  tx: Prisma.TransactionClient,
  input: { communityId: string; actionId: string; actorUserId: string },
) {
  const action = await tx.action.findUnique({
    where: { id: input.actionId },
    select: { id: true, communityId: true, type: true, durationMinutes: true, revokedAt: true },
  });

  if (!action) {
    throw new Error("Action not found.");
  }

  if (action.communityId !== input.communityId) {
    await createAuditLog({
      communityId: input.communityId,
      userId: input.actorUserId,
      eventType: AuditEvent.TENANT_VIOLATION,
      metadata: {
        operation: "write",
        resource: "action",
        resourceId: input.actionId,
        resourceCommunityId: action.communityId,
      },
    });
    await createSecurityEvent({
      communityId: input.communityId,
      userId: input.actorUserId,
      severity: "CRITICAL",
      eventType: "cross_tenant_access_attempt",
      metadata: {
        operation: "write",
        resource: "action",
        resourceId: input.actionId,
        resourceCommunityId: action.communityId,
      } as unknown as Prisma.InputJsonValue,
    });
    throw new Error("Action not found.");
  }

  return action;
}

async function requireCaseInCommunity(
  tx: Prisma.TransactionClient,
  input: { communityId: string; caseId: string; actorUserId: string },
) {
  const row = await tx.case.findUnique({
    where: { id: input.caseId },
    select: { id: true, communityId: true },
  });

  if (!row) {
    throw new Error("Case not found.");
  }

  if (row.communityId !== input.communityId) {
    await createAuditLog({
      communityId: input.communityId,
      userId: input.actorUserId,
      eventType: AuditEvent.TENANT_VIOLATION,
      metadata: {
        operation: "write",
        resource: "case",
        resourceId: input.caseId,
        resourceCommunityId: row.communityId,
      },
    });
    await createSecurityEvent({
      communityId: input.communityId,
      userId: input.actorUserId,
      severity: "CRITICAL",
      eventType: "cross_tenant_access_attempt",
      metadata: {
        operation: "write",
        resource: "case",
        resourceId: input.caseId,
        resourceCommunityId: row.communityId,
      } as unknown as Prisma.InputJsonValue,
    });
    throw new Error("Case not found.");
  }

  return row;
}

async function requireReportInCommunity(
  tx: Prisma.TransactionClient,
  input: { communityId: string; reportId: string; actorUserId: string },
) {
  const row = await tx.report.findUnique({
    where: { id: input.reportId },
    select: {
      id: true,
      communityId: true,
      summary: true,
      reporterName: true,
      reporterContact: true,
      accusedPlayerId: true,
      status: true,
    },
  });

  if (!row) {
    throw new Error("Report not found.");
  }

  if (row.communityId !== input.communityId) {
    await createAuditLog({
      communityId: input.communityId,
      userId: input.actorUserId,
      eventType: AuditEvent.TENANT_VIOLATION,
      metadata: {
        operation: "write",
        resource: "report",
        resourceId: input.reportId,
        resourceCommunityId: row.communityId,
      },
    });
    await createSecurityEvent({
      communityId: input.communityId,
      userId: input.actorUserId,
      severity: "CRITICAL",
      eventType: "cross_tenant_access_attempt",
      metadata: {
        operation: "write",
        resource: "report",
        resourceId: input.reportId,
        resourceCommunityId: row.communityId,
      } as unknown as Prisma.InputJsonValue,
    });
    throw new Error("Report not found.");
  }

  return row;
}

async function getActor(actorUserId: string, communityId: string): Promise<Actor> {
  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, disabledAt: true },
  });
  if (!user) throw new Error("User not found.");

  const ctx = await getCommunityAuthContext({ userId: actorUserId, communityId });
  return { id: user.id, disabledAt: user.disabledAt, permissions: ctx.permissions };
}

async function isCommandEnabled(communityId: string, commandId: CommandId) {
  const toggle = await prisma.commandToggle.findUnique({
    where: { communityId_id: { communityId, id: commandId } },
    select: { enabled: true },
  });
  return toggle ? toggle.enabled : true;
}

async function requireSensitiveMode(userId: string, sessionToken: string | null | undefined) {
  if (!sessionToken) {
    throw new Error("Sensitive mode is required for high-risk operations.");
  }

  const grant = await prisma.sensitiveModeGrant.findUnique({
    where: { sessionToken },
    select: { userId: true, expiresAt: true },
  });

  if (!grant || grant.userId !== userId || grant.expiresAt <= new Date()) {
    throw new Error("Sensitive mode is required for high-risk operations.");
  }
}

async function enforceHighRiskCooldown(input: {
  communityId: string;
  actorUserId: string;
  commandId: CommandId;
  seconds: number;
}) {
  if (input.seconds <= 0) return;

  const windowStart = new Date(Date.now() - input.seconds * 1000);
  const recent = await prisma.commandExecution.findFirst({
    where: {
      communityId: input.communityId,
      userId: input.actorUserId,
      commandId: input.commandId,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!recent) return;

  const remaining = Math.max(
    1,
    Math.ceil((recent.createdAt.getTime() + input.seconds * 1000 - Date.now()) / 1000),
  );
  throw new Error(`Command cooldown active. Try again in ${remaining}s.`);
}

async function executeCommand(
  tx: Prisma.TransactionClient,
  input: {
    communityId: string;
    actor: Actor;
    commandId: CommandId;
    parsed: any;
    ip?: string | null;
    userAgent?: string | null;
    approvalId?: string | null;
    approvedByUserId?: string | null;
  },
): Promise<CommandRunResult> {
  const cmd = getCommandDefinition(input.commandId);

  authorize(
    {
      id: input.actor.id,
      disabledAt: input.actor.disabledAt,
      permissions: input.actor.permissions,
    },
    cmd.requiredPermission,
  );

  if (!(await isCommandEnabled(input.communityId, input.commandId))) {
    throw new Error("This command is currently disabled.");
  }

  const now = new Date();

  const metadataBase: Prisma.InputJsonValue = {
    commandId: input.commandId,
    riskLevel: cmd.riskLevel,
    approvalId: input.approvalId ?? undefined,
    approvedByUserId: input.approvedByUserId ?? undefined,
  };

  const redirectUrl =
    input.commandId === "case.export_packet"
      ? `/app/cases/${input.parsed.caseId}/export`
      : undefined;

  switch (input.commandId) {
    case "warning.create": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });
      const action = await tx.action.create({
        data: {
          communityId: input.communityId,
          type: ActionType.WARNING,
          playerId: input.parsed.playerId,
          moderatorUserId: input.actor.id,
          reason: input.parsed.reason,
          evidenceUrls: [],
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { actionId: action.id, playerId: action.playerId, type: action.type },
        },
        tx,
      );

      break;
    }

    case "kick.record": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });
      const action = await tx.action.create({
        data: {
          communityId: input.communityId,
          type: ActionType.KICK,
          playerId: input.parsed.playerId,
          moderatorUserId: input.actor.id,
          reason: input.parsed.reason,
          evidenceUrls: [],
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { actionId: action.id, playerId: action.playerId, type: action.type },
        },
        tx,
      );

      break;
    }

    case "ban.temp": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });
      const action = await tx.action.create({
        data: {
          communityId: input.communityId,
          type: ActionType.TEMP_BAN,
          playerId: input.parsed.playerId,
          moderatorUserId: input.actor.id,
          reason: input.parsed.reason,
          durationMinutes: input.parsed.durationMinutes,
          evidenceUrls: input.parsed.evidenceUrls ?? [],
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            actionId: action.id,
            playerId: action.playerId,
            type: action.type,
            durationMinutes: action.durationMinutes,
          },
        },
        tx,
      );

      break;
    }

    case "ban.perm": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });
      const action = await tx.action.create({
        data: {
          communityId: input.communityId,
          type: ActionType.PERM_BAN,
          playerId: input.parsed.playerId,
          moderatorUserId: input.actor.id,
          reason: input.parsed.reason,
          evidenceUrls: input.parsed.evidenceUrls ?? [],
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { actionId: action.id, playerId: action.playerId, type: action.type },
        },
        tx,
      );

      break;
    }

    case "ban.extend": {
      const action = await requireActionInCommunity(tx, {
        communityId: input.communityId,
        actionId: input.parsed.actionId,
        actorUserId: input.actor.id,
      });
      if (action.type !== ActionType.TEMP_BAN) {
        throw new Error("Only TEMP_BAN actions can be extended.");
      }

      const nextDuration = (action.durationMinutes ?? 0) + input.parsed.extraMinutes;

      const updated = await tx.action.updateMany({
        where: { id: action.id, communityId: input.communityId },
        data: { durationMinutes: nextDuration },
      });

      if (updated.count !== 1) {
        throw new Error("Action not found.");
      }

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            actionId: action.id,
            type: ActionType.TEMP_BAN,
            durationMinutes: nextDuration,
            reason: input.parsed.reason,
          },
        },
        tx,
      );

      break;
    }

    case "ban.remove": {
      const action = await requireActionInCommunity(tx, {
        communityId: input.communityId,
        actionId: input.parsed.actionId,
        actorUserId: input.actor.id,
      });
      if (action.type !== ActionType.TEMP_BAN && action.type !== ActionType.PERM_BAN) {
        throw new Error("Only ban actions can be removed.");
      }
      if (action.revokedAt) {
        throw new Error("This action is already revoked.");
      }

      const updated = await tx.action.updateMany({
        where: { id: action.id, communityId: input.communityId },
        data: {
          revokedAt: now,
          revokedByUserId: input.actor.id,
          revokedReason: input.parsed.reason,
        },
      });

      if (updated.count !== 1) {
        throw new Error("Action not found.");
      }

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_REVOKED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            actionId: action.id,
            reason: input.parsed.reason,
          },
        },
        tx,
      );

      break;
    }

    case "player.flag": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });

      const updated = await tx.player.updateMany({
        where: { id: input.parsed.playerId, communityId: input.communityId },
        data: { status: input.parsed.status },
      });

      if (updated.count !== 1) {
        throw new Error("Player not found.");
      }

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.PLAYER_UPDATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            playerId: input.parsed.playerId,
            status: input.parsed.status,
            reason: input.parsed.reason ?? undefined,
          },
        },
        tx,
      );

      break;
    }

    case "note.add": {
      await requirePlayerInCommunity(tx, {
        communityId: input.communityId,
        playerId: input.parsed.playerId,
        actorUserId: input.actor.id,
      });
      const action = await tx.action.create({
        data: {
          communityId: input.communityId,
          type: ActionType.NOTE,
          playerId: input.parsed.playerId,
          moderatorUserId: input.actor.id,
          reason: input.parsed.note,
          evidenceUrls: [],
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.ACTION_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { actionId: action.id, playerId: action.playerId, type: action.type },
        },
        tx,
      );

      break;
    }

    case "case.from_report": {
      const report = await requireReportInCommunity(tx, {
        communityId: input.communityId,
        reportId: input.parsed.reportId,
        actorUserId: input.actor.id,
      });

      const title = input.parsed.title?.trim() || report.summary.slice(0, 72);
      const description = [
        `Report: ${report.summary}`,
        report.reporterName ? `Reporter: ${report.reporterName}` : null,
        report.reporterContact ? `Contact: ${report.reporterContact}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const accusedPlayerId = report.accusedPlayerId
        ? (
            await tx.player.findUnique({
              where: { id: report.accusedPlayerId },
              select: { id: true, communityId: true },
            })
          )?.communityId === input.communityId
          ? report.accusedPlayerId
          : null
        : null;

      const assignedToUserId = input.parsed.assignToUserId || null;
      if (assignedToUserId) {
        const member = await tx.communityMembership.findUnique({
          where: {
            communityId_userId: { communityId: input.communityId, userId: assignedToUserId },
          },
          select: { id: true },
        });
        if (!member) {
          throw new Error("Assignee must be a member of this community.");
        }
      }

      const caseRecord = await tx.case.create({
        data: {
          communityId: input.communityId,
          title,
          description,
          status: CaseStatus.OPEN,
          assignedToUserId,
          casePlayers: accusedPlayerId
            ? {
                create: [{ playerId: accusedPlayerId }],
              }
            : undefined,
        },
        select: { id: true },
      });

      await tx.report.updateMany({
        where: { id: report.id, communityId: input.communityId },
        data: {
          caseId: caseRecord.id,
          status: report.status === ReportStatus.OPEN ? ReportStatus.IN_REVIEW : report.status,
        },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.CASE_CREATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { caseId: caseRecord.id, reportId: report.id },
        },
        tx,
      );

      break;
    }

    case "case.assign": {
      await requireCaseInCommunity(tx, {
        communityId: input.communityId,
        caseId: input.parsed.caseId,
        actorUserId: input.actor.id,
      });

      const member = await tx.communityMembership.findUnique({
        where: {
          communityId_userId: { communityId: input.communityId, userId: input.parsed.userId },
        },
        select: { id: true },
      });

      if (!member) {
        throw new Error("Assignee must be a member of this community.");
      }

      const updated = await tx.case.updateMany({
        where: { id: input.parsed.caseId, communityId: input.communityId },
        data: { assignedToUserId: input.parsed.userId },
      });

      if (updated.count !== 1) {
        throw new Error("Case not found.");
      }

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.CASE_UPDATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: { caseId: input.parsed.caseId, assignedToUserId: input.parsed.userId },
        },
        tx,
      );

      break;
    }

    case "report.bulk_resolve": {
      const ids = input.parsed.reportIds as string[];
      await tx.report.updateMany({
        where: { communityId: input.communityId, id: { in: ids } },
        data: { status: input.parsed.resolution },
      });

      await createAuditLog(
        {
          userId: input.actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.REPORT_STATUS_UPDATED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            reportIds: ids,
            resolution: input.parsed.resolution,
            note: input.parsed.note ?? undefined,
          },
        },
        tx,
      );

      break;
    }

    case "case.export_packet": {
      break;
    }
  }

  await createAuditLog(
    {
      userId: input.actor.id,
      communityId: input.communityId,
      eventType: AuditEvent.COMMAND_EXECUTED,
      ip: input.ip,
      userAgent: input.userAgent,
      metadata: metadataBase,
    },
    tx,
  );

  await tx.commandExecution.create({
    data: {
      communityId: input.communityId,
      commandId: input.commandId,
      riskLevel: cmd.riskLevel,
      userId: input.actor.id,
      approvalRequestId: input.approvalId ?? null,
    },
  });

  return {
    status: "executed",
    message: `${cmd.name} completed.`,
    redirectUrl,
  };
}

export async function runCommand(input: {
  actorUserId: string;
  communityId: string;
  commandId: CommandId;
  rawInput: unknown;
  sessionToken?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<CommandRunResult> {
  const cmd = getCommandDefinition(input.commandId);
  const actor = await getActor(input.actorUserId, input.communityId);

  authorize(
    { id: actor.id, disabledAt: actor.disabledAt, permissions: actor.permissions },
    cmd.requiredPermission,
  );

  if (!(await isCommandEnabled(input.communityId, input.commandId))) {
    throw new Error("This command is currently disabled.");
  }

  const parsed = cmd.schema.safeParse(input.rawInput);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid command input.");
  }

  const security = await getSecuritySettings(input.communityId);

  if (cmd.riskLevel === RiskLevel.HIGH) {
    if (security.requireSensitiveModeForHighRisk) {
      await requireSensitiveMode(actor.id, input.sessionToken);
    }
    await enforceHighRiskCooldown({
      communityId: input.communityId,
      actorUserId: actor.id,
      commandId: input.commandId,
      seconds: security.highRiskCommandCooldownSeconds,
    });
  }

  if (cmd.riskLevel === RiskLevel.HIGH && security.twoPersonRule) {
    // Prevent spamming high-risk requests.
    if (security.highRiskCommandCooldownSeconds > 0) {
      const windowStart = new Date(Date.now() - security.highRiskCommandCooldownSeconds * 1000);
      const pending = await prisma.approvalRequest.findFirst({
        where: {
          communityId: input.communityId,
          status: ApprovalStatus.PENDING,
          riskLevel: RiskLevel.HIGH,
          requestedByUserId: actor.id,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (pending) {
        const remaining = Math.max(
          1,
          Math.ceil(
            (pending.createdAt.getTime() +
              security.highRiskCommandCooldownSeconds * 1000 -
              Date.now()) /
              1000,
          ),
        );
        throw new Error(`High-risk requests are cooling down. Try again in ${remaining}s.`);
      }
    }

    const approval = await prisma.$transaction(async (tx) => {
      const created = await tx.approvalRequest.create({
        data: {
          communityId: input.communityId,
          status: ApprovalStatus.PENDING,
          riskLevel: cmd.riskLevel,
          requestedByUserId: actor.id,
          payloadJson: {
            commandId: input.commandId,
            input: parsed.data,
          } as unknown as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      await createAuditLog(
        {
          userId: actor.id,
          communityId: input.communityId,
          eventType: AuditEvent.APPROVAL_REQUESTED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            approvalId: created.id,
            commandId: input.commandId,
            riskLevel: cmd.riskLevel,
          } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );

      return created;
    });

    await maybeRecordApprovalSpam({ communityId: input.communityId, userId: actor.id });

    return {
      status: "pending_approval",
      approvalId: approval.id,
      message: "Approval requested. Awaiting a second staff decision.",
    };
  }

  const result = await prisma.$transaction(async (tx) =>
    executeCommand(tx, {
      communityId: input.communityId,
      actor,
      commandId: input.commandId,
      parsed: parsed.data,
      ip: input.ip,
      userAgent: input.userAgent,
    }),
  );

  if (cmd.riskLevel === RiskLevel.HIGH && result.status === "executed") {
    await maybeRecordHighRiskCommandBurst({ communityId: input.communityId, userId: actor.id });
  }

  return result;
}

export async function executeCommandFromApproval(input: {
  approvalId: string;
  approverUserId: string;
  approverSessionToken?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<CommandRunResult> {
  const { result, burst } = await prisma.$transaction(async (tx) => {
    const approval = await tx.approvalRequest.findUnique({
      where: { id: input.approvalId },
      select: {
        id: true,
        communityId: true,
        status: true,
        riskLevel: true,
        requestedByUserId: true,
        payloadJson: true,
      },
    });

    if (!approval) throw new Error("Approval request not found.");
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error("Approval request is no longer pending.");
    }
    if (approval.requestedByUserId === input.approverUserId) {
      throw new Error("Approver must be different from requester.");
    }

    const security = await getSecuritySettings(approval.communityId);
    if (approval.riskLevel === RiskLevel.HIGH) {
      if (security.requireSensitiveModeForHighRisk) {
        await requireSensitiveMode(input.approverUserId, input.approverSessionToken);
      }
    }

    const payload = approval.payloadJson as any;

    // Non-command approvals (e.g., invite join approvals) are handled here so the ApprovalRequest
    // workflow can be reused without duplicating UI.
    if (payload?.kind === "invite.join") {
      const roleId = typeof payload?.roleId === "string" ? payload.roleId : null;
      if (!roleId) throw new Error("Approval payload is missing roleId.");

      const role = await tx.communityRole.findFirst({
        where: { id: roleId, communityId: approval.communityId },
        select: { id: true },
      });
      if (!role) throw new Error("Role not found for this community.");

      await tx.communityMembership.upsert({
        where: {
          communityId_userId: {
            communityId: approval.communityId,
            userId: approval.requestedByUserId,
          },
        },
        create: {
          communityId: approval.communityId,
          userId: approval.requestedByUserId,
          roleId: role.id,
        },
        update: { roleId: role.id },
      });

      await tx.approvalRequest.update({
        where: { id: approval.id },
        data: {
          status: ApprovalStatus.APPROVED,
          decidedByUserId: input.approverUserId,
          decidedAt: new Date(),
        },
      });

      await createAuditLog(
        {
          userId: input.approverUserId,
          communityId: approval.communityId,
          eventType: AuditEvent.APPROVAL_DECIDED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            approvalId: approval.id,
            status: ApprovalStatus.APPROVED,
            kind: "invite.join",
            roleId: role.id,
            targetUserId: approval.requestedByUserId,
          } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );

      return {
        result: { status: "executed", message: "Invite access approved." } as CommandRunResult,
        burst: null,
      };
    }

    const actor = await getActor(approval.requestedByUserId, approval.communityId);
    const commandId = payload?.commandId as CommandId | undefined;
    if (!commandId) throw new Error("Approval payload is missing commandId.");

    if (approval.riskLevel === RiskLevel.HIGH) {
      await enforceHighRiskCooldown({
        communityId: approval.communityId,
        actorUserId: approval.requestedByUserId,
        commandId,
        seconds: security.highRiskCommandCooldownSeconds,
      });
    }

    const cmd = getCommandDefinition(commandId);
    const parsed = cmd.schema.safeParse(payload?.input);
    if (!parsed.success) throw new Error("Approval payload is invalid for the command.");

    const result = await executeCommand(tx, {
      communityId: approval.communityId,
      actor,
      commandId,
      parsed: parsed.data,
      ip: input.ip,
      userAgent: input.userAgent,
      approvalId: approval.id,
      approvedByUserId: input.approverUserId,
    });

    const burst = {
      communityId: approval.communityId,
      userId: approval.requestedByUserId,
      riskLevel: approval.riskLevel,
    };

    await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.APPROVED,
        decidedByUserId: input.approverUserId,
        decidedAt: new Date(),
      },
    });

    await createAuditLog(
      {
        userId: input.approverUserId,
        communityId: approval.communityId,
        eventType: AuditEvent.APPROVAL_DECIDED,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          approvalId: approval.id,
          status: ApprovalStatus.APPROVED,
          commandId,
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { result, burst };
  });

  if (burst && burst.riskLevel === RiskLevel.HIGH && result.status === "executed") {
    await maybeRecordHighRiskCommandBurst({ communityId: burst.communityId, userId: burst.userId });
  }

  return result;
}

export async function rejectApproval(input: {
  approvalId: string;
  approverUserId: string;
  approverSessionToken?: string | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const approval = await tx.approvalRequest.findUnique({
      where: { id: input.approvalId },
      select: {
        id: true,
        communityId: true,
        status: true,
        riskLevel: true,
        requestedByUserId: true,
        payloadJson: true,
      },
    });

    if (!approval) throw new Error("Approval request not found.");
    if (approval.status !== ApprovalStatus.PENDING) {
      throw new Error("Approval request is no longer pending.");
    }
    if (approval.requestedByUserId === input.approverUserId) {
      throw new Error("Approver must be different from requester.");
    }

    const security = await getSecuritySettings(approval.communityId);
    if (approval.riskLevel === RiskLevel.HIGH && security.requireSensitiveModeForHighRisk) {
      // Rejecting a high-risk request is also a sensitive operation.
      await requireSensitiveMode(input.approverUserId, input.approverSessionToken);
    }

    await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.REJECTED,
        decidedByUserId: input.approverUserId,
        decidedAt: new Date(),
        reason: input.reason ?? null,
      },
    });

    await createAuditLog(
      {
        userId: input.approverUserId,
        communityId: approval.communityId,
        eventType: AuditEvent.APPROVAL_DECIDED,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          approvalId: approval.id,
          status: ApprovalStatus.REJECTED,
          reason: input.reason ?? undefined,
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { ok: true } as const;
  });
}
