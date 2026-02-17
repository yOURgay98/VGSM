import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getSecuritySettings } from "@/lib/services/security-settings";

export type SecurityEventSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

function severityRank(sev: SecurityEventSeverity) {
  switch (sev) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 2;
    case "HIGH":
      return 3;
    case "CRITICAL":
      return 4;
  }
}

function meetsThreshold(sev: SecurityEventSeverity, threshold: SecurityEventSeverity) {
  return severityRank(sev) >= severityRank(threshold);
}

const AUTO_FREEZE_EVENT_TYPES = new Set<string>([
  "cross_tenant_access_attempt",
  "login_failed_burst",
]);

async function maybeAutoFreezeFromEvent(input: {
  communityId: string;
  userId: string;
  severity: SecurityEventSeverity;
  eventType: string;
  metadata?: Prisma.InputJsonValue | null;
}) {
  if (!AUTO_FREEZE_EVENT_TYPES.has(input.eventType)) return;

  const settings = await getSecuritySettings(input.communityId);
  if (!settings.autoFreezeEnabled) return;

  const threshold = settings.autoFreezeThreshold ?? "CRITICAL";
  if (!meetsThreshold(input.severity, threshold)) return;

  const target = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, disabledAt: true },
  });
  if (!target) return;

  // Safety: never auto-freeze owners; require a human decision.
  if (target.role === Role.OWNER) return;
  if (target.disabledAt) return;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: { disabledAt: new Date() },
    });

    await tx.session.deleteMany({ where: { userId: target.id } });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: null,
        eventType: AuditEvent.USER_DISABLED,
        metadata: {
          targetUserId: target.id,
          disabled: true,
          source: "auto_freeze",
          trigger: {
            eventType: input.eventType,
            severity: input.severity,
            metadata: input.metadata ?? null,
          },
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );
  });
}

export async function createSecurityEvent(input: {
  communityId?: string | null;
  userId?: string | null;
  severity: SecurityEventSeverity;
  eventType: string;
  metadata?: Prisma.InputJsonValue | null;
}) {
  const created = await prisma.securityEvent.create({
    data: {
      communityId: input.communityId ?? null,
      userId: input.userId ?? null,
      severity: input.severity,
      eventType: input.eventType,
      metadata: input.metadata ?? undefined,
    },
    select: {
      id: true,
      communityId: true,
      userId: true,
      severity: true,
      eventType: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (created.communityId && created.userId) {
    await maybeAutoFreezeFromEvent({
      communityId: created.communityId,
      userId: created.userId,
      severity: created.severity as SecurityEventSeverity,
      eventType: created.eventType,
      metadata: (created.metadata ?? null) as unknown as Prisma.InputJsonValue | null,
    });
  }

  return created;
}

export async function listSecurityEvents(input: {
  communityId: string;
  take?: number;
  cursor?: string | null;
  severity?: SecurityEventSeverity | null;
  eventType?: string | null;
  userId?: string | null;
  includeGlobalForUserIds?: readonly string[] | null;
}) {
  const take = Math.min(Math.max(input.take ?? 80, 1), 200);
  const eventType = input.eventType?.trim() ? input.eventType.trim().slice(0, 64) : null;

  const globalUserIds = input.includeGlobalForUserIds?.length
    ? Array.from(new Set(input.includeGlobalForUserIds))
    : null;

  const where: Prisma.SecurityEventWhereInput = {
    ...(globalUserIds
      ? {
          OR: [
            { communityId: input.communityId },
            { communityId: null, userId: { in: globalUserIds } },
          ],
        }
      : { communityId: input.communityId }),
    ...(input.severity ? { severity: input.severity } : {}),
    ...(eventType ? { eventType: { contains: eventType, mode: "insensitive" } } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
  };

  const items = await prisma.securityEvent.findMany({
    where,
    take,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    select: {
      id: true,
      communityId: true,
      severity: true,
      eventType: true,
      createdAt: true,
      metadata: true,
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  const nextCursor = items.length === take ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

export async function maybeRecordHighRiskCommandBurst(input: {
  communityId: string;
  userId: string;
}) {
  const since = new Date(Date.now() - 10 * 60_000);
  const count = await prisma.commandExecution.count({
    where: {
      communityId: input.communityId,
      userId: input.userId,
      riskLevel: "HIGH",
      createdAt: { gte: since },
    },
  });

  if (count < 3) return;

  const already = await prisma.securityEvent.findFirst({
    where: {
      communityId: input.communityId,
      userId: input.userId,
      eventType: "high_risk_command_burst",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (already) return;

  await createSecurityEvent({
    communityId: input.communityId,
    userId: input.userId,
    severity: count >= 6 ? "CRITICAL" : "HIGH",
    eventType: "high_risk_command_burst",
    metadata: { count, windowMinutes: 10 },
  });
}

export async function maybeRecordApprovalSpam(input: { communityId: string; userId: string }) {
  const since = new Date(Date.now() - 10 * 60_000);
  const count = await prisma.approvalRequest.count({
    where: {
      communityId: input.communityId,
      requestedByUserId: input.userId,
      createdAt: { gte: since },
    },
  });
  if (count < 5) return;

  const already = await prisma.securityEvent.findFirst({
    where: {
      communityId: input.communityId,
      userId: input.userId,
      eventType: "approval_spam",
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (already) return;

  await createSecurityEvent({
    communityId: input.communityId,
    userId: input.userId,
    severity: "MEDIUM",
    eventType: "approval_spam",
    metadata: { count, windowMinutes: 10 },
  });
}
