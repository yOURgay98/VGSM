"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma, RiskLevel } from "@prisma/client";

import { runCommand, executeCommandFromApproval, rejectApproval } from "@/lib/commands/run";
import type { CommandId } from "@/lib/commands/types";
import { prisma } from "@/lib/db";
import { requirePermission, requireSessionUser } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { Permission } from "@/lib/security/permissions";
import { getCurrentSessionToken } from "@/lib/services/session";

function getRequestMeta(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function runCommandAction(commandId: CommandId, rawInput: unknown) {
  const user = await requirePermission(Permission.COMMANDS_RUN);
  const sessionToken = await getCurrentSessionToken();
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const result = await runCommand({
    actorUserId: user.id,
    communityId: user.communityId,
    commandId,
    rawInput,
    sessionToken,
    ip,
    userAgent,
  });

  // Broad-but-safe invalidation. This keeps the console feeling "live" without overthinking.
  revalidatePath("/app/dashboard");
  revalidatePath("/app/players");
  revalidatePath("/app/cases");
  revalidatePath("/app/reports");
  revalidatePath("/app/actions");
  revalidatePath("/app/audit");
  revalidatePath("/app/inbox");

  return result;
}

export async function approveCommandAction(approvalId: string) {
  const approver = await requirePermission(Permission.APPROVALS_DECIDE);
  const approverSessionToken = await getCurrentSessionToken();
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const result = await executeCommandFromApproval({
    approvalId,
    approverUserId: approver.id,
    approverSessionToken,
    ip,
    userAgent,
  });

  revalidatePath("/app/inbox");
  revalidatePath("/app/audit");
  revalidatePath("/app/actions");
  revalidatePath("/app/players");
  revalidatePath("/app/cases");
  revalidatePath("/app/reports");
  revalidatePath("/app/dashboard");

  return result;
}

export async function rejectCommandAction(approvalId: string, reason?: string) {
  const approver = await requirePermission(Permission.APPROVALS_DECIDE);
  const approverSessionToken = await getCurrentSessionToken();
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  const result = await rejectApproval({
    approvalId,
    approverUserId: approver.id,
    approverSessionToken,
    reason: reason?.trim() || null,
    ip,
    userAgent,
  });

  revalidatePath("/app/inbox");
  revalidatePath("/app/audit");
  return result;
}

export async function setCommandEnabledAction(commandId: CommandId, enabled: boolean) {
  const user = await requirePermission(Permission.COMMANDS_MANAGE);
  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  await prisma.commandToggle.upsert({
    where: { communityId_id: { communityId: user.communityId, id: commandId } },
    create: {
      communityId: user.communityId,
      id: commandId,
      enabled,
      updatedByUserId: user.id,
    },
    update: {
      enabled,
      updatedByUserId: user.id,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.COMMAND_TOGGLED,
    ip,
    userAgent,
    communityId: user.communityId,
    metadata: { commandId, enabled } as unknown as Prisma.InputJsonValue,
  });

  revalidatePath("/app/commands");
  return { ok: true } as const;
}
