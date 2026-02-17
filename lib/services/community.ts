import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/security/permissions";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { getCurrentSessionToken } from "@/lib/services/session";

export const DEFAULT_COMMUNITY_ID = "community_default";

export type CommunitySummary = { id: string; name: string; slug: string };

function normalizeCommunityId(id: string | null | undefined) {
  const trimmed = (id ?? "").trim();
  return trimmed.length ? trimmed : null;
}

function toCommunitySummary(row: { id: string; name: string; slug: string }): CommunitySummary {
  return { id: row.id, name: row.name, slug: row.slug };
}

export async function ensureCommunitySystemRoles(communityId: string) {
  const specs: Array<{ role: Role; priority: number }> = [
    { role: Role.OWNER, priority: ROLE_PRIORITY.OWNER },
    { role: Role.ADMIN, priority: ROLE_PRIORITY.ADMIN },
    { role: Role.MOD, priority: ROLE_PRIORITY.MOD },
    { role: Role.TRIAL_MOD, priority: ROLE_PRIORITY.TRIAL_MOD },
    { role: Role.VIEWER, priority: ROLE_PRIORITY.VIEWER },
  ];

  // Fast path: if the full system role set already exists and is marked as system-default,
  // avoid doing writes on every request.
  const expectedNames = specs.map((s) => s.role);
  const existing = await prisma.communityRole.findMany({
    where: { communityId, name: { in: expectedNames } },
    select: { name: true, isSystemDefault: true },
  });
  const existingByName = new Map(existing.map((r) => [r.name, r.isSystemDefault]));
  const complete = expectedNames.every((name) => existingByName.get(name) === true);
  if (complete) return;

  await prisma.$transaction(async (tx) => {
    for (const spec of specs) {
      // Use upsert so initialization is idempotent and safe under concurrency.
      const roleRecord = await tx.communityRole.upsert({
        where: { communityId_name: { communityId, name: spec.role } },
        create: {
          communityId,
          name: spec.role,
          description: `${spec.role} (system)`,
          isSystemDefault: true,
          priority: spec.priority,
        },
        update: {
          description: `${spec.role} (system)`,
          isSystemDefault: true,
          priority: spec.priority,
        },
        select: { id: true, name: true },
      });

      const perms = ROLE_PERMISSIONS[spec.role] ?? [];
      if (perms.length) {
        await tx.communityRolePermission.createMany({
          data: perms.map((p) => ({ roleId: roleRecord.id, permission: p })),
          skipDuplicates: true,
        });
      }
    }
  });
}

export async function assertMembershipForUser(input: { userId: string; communityId: string }) {
  const membership = await prisma.communityMembership.findUnique({
    where: {
      communityId_userId: { communityId: input.communityId, userId: input.userId },
    },
    select: { id: true },
  });

  if (!membership) {
    throw new Error("Not a member of this community.");
  }

  return membership;
}

export async function listCommunitiesForUser(userId: string) {
  const memberships = await prisma.communityMembership.findMany({
    where: { userId },
    select: {
      community: { select: { id: true, name: true, slug: true } },
      role: { select: { id: true, name: true, priority: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m) => ({
    ...toCommunitySummary(m.community),
    role: m.role,
  }));
}

export async function resolveActiveCommunityId(userId: string): Promise<string | null> {
  const token = await getCurrentSessionToken();

  // In bypass/no-cookie edge cases this can be null; we can still resolve from memberships.
  const session = await prisma.session.findUnique({
    where: token ? { sessionToken: token } : { sessionToken: "__missing__" },
    select: { userId: true, activeCommunityId: true },
  });

  const current = normalizeCommunityId(session?.activeCommunityId);
  if (session?.userId === userId && current) {
    const ok = await prisma.communityMembership.findUnique({
      where: { communityId_userId: { communityId: current, userId } },
      select: { id: true },
    });
    if (ok) return current;
  }

  // Pick the oldest membership as the default active community.
  const membership = await prisma.communityMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { communityId: true },
  });

  const nextCommunityId = membership?.communityId ?? null;
  if (!nextCommunityId) {
    return null;
  }

  if (token) {
    await prisma.session.updateMany({
      where: { sessionToken: token, userId },
      data: { activeCommunityId: nextCommunityId },
    });
  }

  return nextCommunityId;
}

export async function requireActiveCommunityId(userId: string): Promise<string> {
  const communityId = await resolveActiveCommunityId(userId);
  if (!communityId) {
    throw new Error("No active community. Join or create a community first.");
  }
  return communityId;
}

export async function getCommunityById(communityId: string): Promise<CommunitySummary | null> {
  const row = await prisma.community.findUnique({
    where: { id: communityId },
    select: { id: true, name: true, slug: true },
  });
  return row ? toCommunitySummary(row) : null;
}

export type CommunityAuthContext = {
  community: CommunitySummary;
  membership: {
    id: string;
    role: { id: string; name: string; priority: number; isSystemDefault: boolean };
  };
  permissions: readonly Permission[];
};

export async function getCommunityAuthContext(input: {
  userId: string;
  communityId: string;
}): Promise<CommunityAuthContext> {
  await ensureCommunitySystemRoles(input.communityId);

  const membership = await prisma.communityMembership.findUnique({
    where: {
      communityId_userId: { communityId: input.communityId, userId: input.userId },
    },
    select: {
      id: true,
      community: { select: { id: true, name: true, slug: true } },
      role: {
        select: {
          id: true,
          name: true,
          priority: true,
          isSystemDefault: true,
          permissions: { select: { permission: true } },
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Membership missing.");
  }

  const perms: Permission[] = [];
  for (const p of membership.role.permissions) {
    const val = p.permission as Permission;
    perms.push(val);
  }

  return {
    community: toCommunitySummary(membership.community),
    membership: { id: membership.id, role: membership.role },
    permissions: perms,
  };
}
