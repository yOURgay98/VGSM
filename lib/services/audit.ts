import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { computeAuditHash } from "@/lib/security/audit-hash";

export const AuditEvent = {
  LOGIN_SUCCESS: "login.success",
  LOGIN_FAILED: "login.failed",
  LOGOUT: "logout",
  SESSION_REVOKED: "session.revoked",
  SESSION_REVOKE_OTHERS: "session.revoke_others",
  USER_DISABLED: "user.disabled",
  USER_ENABLED: "user.enabled",
  INVITE_CREATED: "invite.created",
  INVITE_REDEEMED: "invite.redeemed",
  INVITE_REVOKED: "invite.revoked",
  PLAYER_CREATED: "player.created",
  PLAYER_UPDATED: "player.updated",
  ACTION_CREATED: "action.created",
  ACTION_DELETED: "action.deleted",
  ACTION_REVOKED: "action.revoked",
  CASE_CREATED: "case.created",
  CASE_COMMENTED: "case.commented",
  CASE_UPDATED: "case.updated",
  REPORT_CREATED: "report.created",
  REPORT_STATUS_UPDATED: "report.status_updated",
  REPORT_ASSIGNED: "report.assigned",
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  SETTINGS_UPDATED: "settings.updated",
  PASSWORD_CHANGED: "password.changed",
  TWO_FACTOR_ENROLL_STARTED: "2fa.enroll_started",
  TWO_FACTOR_ENABLED: "2fa.enabled",
  TWO_FACTOR_DISABLED: "2fa.disabled",
  BACKUP_CODES_REGENERATED: "2fa.backup_regenerated",
  APPROVAL_REQUESTED: "approval.requested",
  APPROVAL_DECIDED: "approval.decided",
  COMMAND_EXECUTED: "command.executed",
  COMMAND_TOGGLED: "command.toggled",
  VIEW_SAVED: "view.saved",
  VIEW_DELETED: "view.deleted",
  MAP_POI_CREATED: "map.poi.created",
  MAP_POI_UPDATED: "map.poi.updated",
  MAP_POI_DELETED: "map.poi.deleted",
  MAP_ZONE_CREATED: "map.zone.created",
  MAP_ZONE_UPDATED: "map.zone.updated",
  MAP_ZONE_DELETED: "map.zone.deleted",
  SENSITIVE_MODE_ENABLED: "sensitive_mode.enabled",
  SENSITIVE_MODE_DISABLED: "sensitive_mode.disabled",
  COMMUNITY_SWITCHED: "community.switched",
  TENANT_VIOLATION: "tenant.violation",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  BETA_KEY_CREATED: "beta_key.created",
  BETA_KEY_REDEEMED: "beta_key.redeemed",
  BETA_KEY_REVOKED: "beta_key.revoked",
  MODERATION_MACRO_CREATED: "moderation.macro.created",
  MODERATION_MACRO_DELETED: "moderation.macro.deleted",
  DISCORD_LINKED: "discord.linked",
  DISCORD_UNLINKED: "discord.unlinked",
  DISCORD_CONFIG_UPDATED: "discord.config_updated",
  DISCORD_BOT_COMMAND: "discord.bot.command",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];
let lastAuditWriteErrorLoggedAt = 0;
const AUDIT_CHAIN_LOCK_KEY = 3182001;

interface AuditLogInput {
  communityId?: string | null;
  userId?: string | null;
  eventType: string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

async function writeAuditLog(client: Prisma.TransactionClient, input: AuditLogInput) {
  await client.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY});`;

  const last = await client.auditLog.findFirst({
    orderBy: { chainIndex: "desc" },
    select: { chainIndex: true, hash: true },
  });

  const chainIndex = (last?.chainIndex ?? 0) + 1;
  const prevHash = last?.hash ?? null;
  const createdAt = new Date();
  const metadata = input.metadata ?? null;

  const hash = computeAuditHash({
    prevHash,
    chainIndex,
    communityId: input.communityId ?? null,
    userId: input.userId ?? null,
    eventType: input.eventType,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata,
    createdAt,
  });

  await client.auditLog.create({
    data: {
      chainIndex,
      prevHash,
      hash,
      communityId: input.communityId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      metadataJson: metadata ?? undefined,
      createdAt,
    },
  });
}

export async function createAuditLog(input: AuditLogInput, tx?: Prisma.TransactionClient) {
  try {
    if (tx) {
      await writeAuditLog(tx, input);
      return;
    }

    await prisma.$transaction(async (innerTx) => {
      await writeAuditLog(innerTx, input);
    });
  } catch (error) {
    // In dev auth bypass mode it's possible to have a "session user" that isn't a real DB user.
    // Never let that spam the server logs or break the audit chain; fall back to anonymous logs.
    if (
      input.userId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      try {
        const meta = input.metadata ?? null;
        const nextMetadata: Prisma.InputJsonValue =
          meta && typeof meta === "object" && !Array.isArray(meta)
            ? ({
                ...(meta as Record<string, unknown>),
                actorUserId: input.userId,
              } as Prisma.InputJsonObject)
            : ({ actorUserId: input.userId, metadata: meta } as Prisma.InputJsonObject);

        if (tx) {
          await writeAuditLog(tx, { ...input, userId: null, metadata: nextMetadata });
          return;
        }

        await prisma.$transaction(async (innerTx) => {
          await writeAuditLog(innerTx, { ...input, userId: null, metadata: nextMetadata });
        });
        return;
      } catch {
        // Fall through to throttled error logging.
      }
    }

    const now = Date.now();
    if (now - lastAuditWriteErrorLoggedAt > 10_000) {
      lastAuditWriteErrorLoggedAt = now;
      console.error("[audit] Failed to write audit log entry.", error);
    }
  }
}
