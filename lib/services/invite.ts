import { createHash, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { createSecurityEvent, maybeRecordApprovalSpam } from "@/lib/services/security-events";
import {
  DEFAULT_COMMUNITY_ID,
  assertMembershipForUser,
  ensureCommunitySystemRoles,
} from "@/lib/services/community";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { consumeBetaAccessKey } from "@/lib/services/beta-keys";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

export type InviteSummary = {
  id: string;
  tokenPreview: string;
  communityId: string;
  expiresAt: Date | null;
  maxUses: number;
  uses: number;
  require2fa: boolean;
  requireApproval: boolean;
  revokedAt: Date | null;
  createdAt: Date;
  createdByUser: { id: string; name: string; email: string } | null;
  role: { id: string; name: string } | null;
  template: { id: string; name: string } | null;
};

function normalizeToken(token: string) {
  return token.trim();
}

function tokenPreview(token: string) {
  const normalized = normalizeToken(token);
  if (normalized.length <= 14) return normalized;
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}

function hashInviteToken(token: string) {
  const normalized = normalizeToken(token);
  return createHash("sha256").update(normalized).digest("hex");
}

export async function createInvite(input: {
  communityId: string;
  roleId?: string | null;
  templateId?: string | null;
  expiresAt?: Date | null;
  maxUses: number;
  require2fa?: boolean;
  requireApproval?: boolean;
  createdByUserId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const communityId = input.communityId || DEFAULT_COMMUNITY_ID;
  await ensureCommunitySystemRoles(communityId);

  const template = input.templateId
    ? await prisma.inviteTemplate.findFirst({
        where: { id: input.templateId, communityId },
        select: {
          id: true,
          name: true,
          defaultRoleId: true,
          expiresInMinutes: true,
          maxUses: true,
          require2fa: true,
          requireApproval: true,
        },
      })
    : null;

  const roleId = input.roleId ?? template?.defaultRoleId ?? null;
  if (!roleId) {
    throw new Error("Invite must specify a role or template.");
  }

  const role = await prisma.communityRole.findFirst({
    where: { id: roleId, communityId },
    select: { id: true, name: true },
  });
  if (!role) {
    throw new Error("Role not found for this community.");
  }

  const expiresAt =
    input.expiresAt ??
    (template?.expiresInMinutes ? new Date(Date.now() + template.expiresInMinutes * 60_000) : null);

  const maxUses =
    Number.isFinite(input.maxUses) && input.maxUses > 0 ? Math.floor(input.maxUses) : 1;
  const resolvedMaxUses =
    template?.maxUses && template.maxUses > 0 ? Math.min(maxUses, template.maxUses) : maxUses;

  const require2fa = Boolean(input.require2fa) || Boolean(template?.require2fa);
  const requireApproval = Boolean(input.requireApproval) || Boolean(template?.requireApproval);

  let rawToken = "";
  let createdInvite: {
    id: string;
    tokenPreview: string;
    communityId: string;
    expiresAt: Date | null;
    maxUses: number;
    uses: number;
    require2fa: boolean;
    requireApproval: boolean;
    createdAt: Date;
  } | null = null;

  // Generate a raw token once (shown to the creator only) but store only a hash.
  // Retry on the off-chance of a hash collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    rawToken = randomBytes(24).toString("hex");
    const tokenHash = hashInviteToken(rawToken);
    const preview = tokenPreview(rawToken);

    try {
      createdInvite = await prisma.invite.create({
        data: {
          communityId,
          tokenHash,
          tokenPreview: preview,
          roleId: role.id,
          templateId: template?.id ?? null,
          expiresAt,
          maxUses: resolvedMaxUses,
          require2fa,
          requireApproval,
          createdByUserId: input.createdByUserId,
        },
        select: {
          id: true,
          tokenPreview: true,
          communityId: true,
          expiresAt: true,
          maxUses: true,
          uses: true,
          require2fa: true,
          requireApproval: true,
          createdAt: true,
        },
      });
      break;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Collision, retry.
        continue;
      }
      throw error;
    }
  }

  if (!createdInvite) {
    throw new Error("Unable to generate an invite token. Try again.");
  }

  await createAuditLog({
    userId: input.createdByUserId,
    communityId,
    eventType: AuditEvent.INVITE_CREATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      inviteId: createdInvite.id,
      roleId: role.id,
      templateId: template?.id ?? null,
      expiresAt: createdInvite.expiresAt,
      maxUses: createdInvite.maxUses,
      require2fa,
      requireApproval,
    },
  });

  return { ...createdInvite, token: rawToken };
}

export async function redeemInvite(input: {
  token: string;
  email: string;
  name: string;
  password: string | null;
  betaKey?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  // If present, allow an existing signed-in user to redeem and join the community.
  existingUserId?: string | null;
}) {
  const tokenHash = hashInviteToken(input.token);
  const invite = await prisma.invite.findUnique({
    where: { tokenHash },
    include: {
      community: { select: { id: true, name: true, slug: true } },
      role: { select: { id: true, name: true } },
      template: {
        select: {
          id: true,
          name: true,
          defaultRoleId: true,
          require2fa: true,
          requireApproval: true,
        },
      },
    },
  });

  if (!invite) throw new Error("Invite not found.");
  if (invite.revokedAt) throw new Error("Invite has been revoked.");
  if (invite.expiresAt && invite.expiresAt < new Date()) throw new Error("Invite has expired.");
  if (invite.uses >= invite.maxUses) throw new Error("Invite has no remaining uses.");

  const roleId = invite.roleId ?? invite.template?.defaultRoleId ?? null;
  if (!roleId) {
    throw new Error("Invite is misconfigured (missing role).");
  }

  const require2fa = invite.require2fa || Boolean(invite.template?.require2fa);
  const requireApproval = invite.requireApproval || Boolean(invite.template?.requireApproval);
  const security = await getSecuritySettings(invite.communityId);
  const betaEnabled = Boolean(security.betaAccessEnabled);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true },
  });

  const userIdToUse = existing?.id ?? input.existingUserId ?? null;

  const result = await prisma.$transaction(async (tx) => {
    let userId = userIdToUse;

    if (input.existingUserId) {
      const byId = await tx.user.findUnique({
        where: { id: input.existingUserId },
        select: { id: true, email: true },
      });
      if (!byId) {
        throw new Error("Signed-in user record missing. Sign in again and retry.");
      }
      if (byId.email !== input.email) {
        throw new Error("Signed-in user mismatch. Sign in again and retry.");
      }
    }

    if (existing) {
      if (!input.existingUserId || input.existingUserId !== existing.id) {
        throw new Error("An account already exists for this email. Sign in to redeem this invite.");
      }
    }

    if (!userId) {
      if (!input.password) {
        throw new Error("Password is required.");
      }
      const passwordHash = await hashPassword(input.password);
      const created = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: "VIEWER",
        },
        select: { id: true },
      });
      userId = created.id;
    }

    // Beta access gate: only required when creating a new membership for this community.
    if (betaEnabled) {
      const membership = await tx.communityMembership.findUnique({
        where: { communityId_userId: { communityId: invite.communityId, userId } },
        select: { id: true },
      });
      if (!membership) {
        const key = (input.betaKey ?? "").trim();
        if (!key) {
          throw new Error("Access key is required to join this community.");
        }
        await consumeBetaAccessKey(
          {
            communityId: invite.communityId,
            actorUserId: userId,
            key,
            ip: input.ip,
            userAgent: input.userAgent,
          },
          tx,
        );
      }
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: {
        uses: { increment: 1 },
        redeemedByUserIds: { push: userId },
      },
    });

    if (requireApproval) {
      const approval = await tx.approvalRequest.create({
        data: {
          communityId: invite.communityId,
          status: "PENDING",
          riskLevel: "MEDIUM",
          requestedByUserId: userId,
          payloadJson: {
            kind: "invite.join",
            inviteId: invite.id,
            userId,
            roleId,
            require2fa,
          },
        },
        select: { id: true },
      });

      await createAuditLog(
        {
          userId,
          communityId: invite.communityId,
          eventType: AuditEvent.APPROVAL_REQUESTED,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            approvalId: approval.id,
            kind: "invite.join",
            inviteId: invite.id,
          },
        },
        tx,
      );

      return { userId, require2fa, requireApproval: true, communityId: invite.communityId };
    }

    // Ensure the invite's target role exists, then join community.
    await ensureCommunitySystemRoles(invite.communityId);
    await tx.communityMembership.upsert({
      where: { communityId_userId: { communityId: invite.communityId, userId } },
      create: { communityId: invite.communityId, userId, roleId },
      update: { roleId },
    });

    // Best-effort: if strict posture requires 2FA for this role, the secure layout will gate access.
    // We keep the invite-level require2fa flag for UI and auditing.

    return { userId, require2fa, requireApproval: false, communityId: invite.communityId };
  });

  await createAuditLog({
    userId: result.userId,
    communityId: invite.communityId,
    eventType: AuditEvent.INVITE_REDEEMED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      inviteId: invite.id,
      communityId: invite.communityId,
      roleId,
      require2fa,
      requireApproval,
      email: input.email,
    },
  });

  if (result.requireApproval) {
    await maybeRecordApprovalSpam({ communityId: invite.communityId, userId: result.userId });
  }

  if (input.ip) {
    const since = new Date(Date.now() - 30 * 60_000);
    const redeems = await prisma.auditLog.count({
      where: {
        communityId: invite.communityId,
        eventType: AuditEvent.INVITE_REDEEMED,
        ip: input.ip,
        createdAt: { gte: since },
      },
    });

    if (redeems >= 5) {
      await createSecurityEvent({
        communityId: invite.communityId,
        severity: redeems >= 10 ? "CRITICAL" : "HIGH",
        eventType: "invite_redeem_burst",
        metadata: { ip: input.ip, redeems, windowMinutes: 30, inviteId: invite.id },
      });
    }
  }

  // If approval is required, membership is created only after a second staff decision.
  if (!result.requireApproval) {
    await assertMembershipForUser({ userId: result.userId, communityId: invite.communityId });
  }

  return result;
}

export async function getInviteByToken(token: string) {
  const tokenHash = hashInviteToken(token);
  return prisma.invite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      tokenPreview: true,
      communityId: true,
      roleId: true,
      templateId: true,
      expiresAt: true,
      maxUses: true,
      uses: true,
      require2fa: true,
      requireApproval: true,
      revokedAt: true,
      createdAt: true,
    },
  });
}

export async function getInviteDetailsByToken(token: string) {
  const tokenHash = hashInviteToken(token);
  return prisma.invite.findUnique({
    where: { tokenHash },
    include: {
      community: { select: { id: true, name: true, slug: true } },
      role: { select: { id: true, name: true } },
      template: {
        select: {
          id: true,
          name: true,
          defaultRoleId: true,
          require2fa: true,
          requireApproval: true,
        },
      },
    },
  });
}

export async function listInvites(input: { communityId: string }): Promise<InviteSummary[]> {
  const invites = await prisma.invite.findMany({
    where: { communityId: input.communityId },
    orderBy: { createdAt: "desc" },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      role: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
  });

  return invites.map((invite) => ({
    id: invite.id,
    tokenPreview: invite.tokenPreview,
    communityId: invite.communityId,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    uses: invite.uses,
    require2fa: invite.require2fa,
    requireApproval: invite.requireApproval,
    revokedAt: invite.revokedAt,
    createdAt: invite.createdAt,
    createdByUser: invite.createdByUser,
    role: invite.role,
    template: invite.template,
  }));
}

export async function revokeInvite(input: {
  communityId: string;
  inviteId: string;
  actorUserId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const invite = await prisma.invite.findFirst({
    where: { id: input.inviteId, communityId: input.communityId },
    select: { id: true, revokedAt: true, tokenPreview: true },
  });

  if (!invite) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "invite",
      resourceId: input.inviteId,
      operation: "delete",
    });
    throw new Error("Invite not found.");
  }

  if (invite.revokedAt) {
    return { ok: true as const };
  }

  await prisma.invite.update({
    where: { id: invite.id },
    data: { revokedAt: new Date() },
    select: { id: true },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.INVITE_REVOKED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { inviteId: invite.id, tokenPreview: invite.tokenPreview } as any,
  });

  return { ok: true as const };
}

export async function listInviteTemplates(input: { communityId: string }) {
  return prisma.inviteTemplate.findMany({
    where: { communityId: input.communityId },
    orderBy: { createdAt: "desc" },
    include: {
      defaultRole: { select: { id: true, name: true } },
    },
  });
}

export async function createInviteTemplate(input: {
  communityId: string;
  name: string;
  defaultRoleId: string;
  expiresInMinutes?: number | null;
  maxUses?: number | null;
  require2fa?: boolean;
  requireApproval?: boolean;
  notes?: string | null;
  actorUserId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const tpl = await prisma.inviteTemplate.create({
    data: {
      communityId: input.communityId,
      name: input.name,
      defaultRoleId: input.defaultRoleId,
      expiresInMinutes: input.expiresInMinutes ?? null,
      maxUses: input.maxUses ?? null,
      require2fa: Boolean(input.require2fa),
      requireApproval: Boolean(input.requireApproval),
      notes: input.notes ?? null,
    },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: "invite_template.created",
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      templateId: tpl.id,
      name: tpl.name,
      defaultRoleId: tpl.defaultRoleId,
      require2fa: tpl.require2fa,
      requireApproval: tpl.requireApproval,
    },
  });

  return tpl;
}
