import { prisma } from "@/lib/db";
import { ROLE_PRIORITY } from "@/lib/permissions";

const METRICS_TTL_MS = 10_000;

export type SecurityDashboardMetrics = {
  activeSessions: number;
  failedLoginAttempts: number;
  approvalsPending: number;
  highRiskCommands7d: number;
  lockedUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    lockedUntil: Date | null;
    failedLoginCount: number;
  }>;
  suspiciousNewIp: Array<{
    id: string;
    createdAt: Date;
    severity: string;
    user: { id: string; name: string; email: string; role: string } | null;
    metadata: unknown | null;
  }>;
  staff: {
    total: number;
    with2fa: number;
    pct2fa: number;
    byRole: {
      OWNER: { total: number; with2fa: number };
      ADMIN: { total: number; with2fa: number };
      MOD: { total: number; with2fa: number };
      TRIAL_MOD: { total: number; with2fa: number };
    };
  };
  recentFailedAttempts: Array<{
    id: string;
    email: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
};

const metricsCache = new Map<string, { at: number; value: SecurityDashboardMetrics }>();

export async function getSecurityDashboardMetrics(input: {
  communityId: string;
}): Promise<SecurityDashboardMetrics> {
  const cached = metricsCache.get(input.communityId);
  const nowMs = Date.now();
  if (cached && nowMs - cached.at < METRICS_TTL_MS) {
    return cached.value;
  }

  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60_000);
  const since7d = new Date(now - 7 * 24 * 60 * 60_000);
  const activeCutoff = new Date(now - 5 * 60_000);

  const staffMemberships = await prisma.communityMembership.findMany({
    where: {
      communityId: input.communityId,
      role: { priority: { gte: ROLE_PRIORITY.TRIAL_MOD } },
      user: { disabledAt: null },
    },
    select: {
      userId: true,
      role: { select: { name: true, priority: true } },
      user: {
        select: {
          id: true,
          twoFactorEnabled: true,
          lockedUntil: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
  const staffUserIds = Array.from(new Set(staffMemberships.map((m) => m.userId)));

  const [
    activeSessions,
    failedLoginAttempts,
    approvalsPending,
    highRiskCommands7d,
    recentFailedAttempts,
    lockedUsers,
    newIpEvents,
  ] = await Promise.all([
    prisma.session.count({
      where: { activeCommunityId: input.communityId, lastActiveAt: { gte: activeCutoff } },
    }),
    prisma.loginAttempt.count({
      where: { success: false, userId: { in: staffUserIds }, createdAt: { gte: since24h } },
    }),
    prisma.approvalRequest.count({ where: { communityId: input.communityId, status: "PENDING" } }),
    prisma.commandExecution.count({
      where: { communityId: input.communityId, riskLevel: "HIGH", createdAt: { gte: since7d } },
    }),
    prisma.loginAttempt.findMany({
      where: { success: false, userId: { in: staffUserIds }, createdAt: { gte: since24h } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, email: true, ip: true, userAgent: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { id: { in: staffUserIds }, disabledAt: null, lockedUntil: { gt: new Date() } },
      orderBy: { lockedUntil: "desc" },
      take: 12,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lockedUntil: true,
        failedLoginCount: true,
      },
    }),
    prisma.securityEvent.findMany({
      where: {
        communityId: input.communityId,
        eventType: "login_new_ip",
        createdAt: { gte: since7d },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        createdAt: true,
        severity: true,
        metadata: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  const roleBuckets = new Map<string, { total: number; with2fa: number }>();
  for (const m of staffMemberships) {
    const name = m.role.name;
    const bucketKey =
      name === "OWNER" || name === "ADMIN" || name === "MOD" || name === "TRIAL_MOD"
        ? name
        : "CUSTOM";
    const bucket = roleBuckets.get(bucketKey) ?? { total: 0, with2fa: 0 };
    bucket.total += 1;
    if (m.user.twoFactorEnabled) bucket.with2fa += 1;
    roleBuckets.set(bucketKey, bucket);
  }
  const staffTotal = staffUserIds.length;
  const staffWith2fa = Array.from(roleBuckets.values()).reduce((acc, b) => acc + b.with2fa, 0);
  const pct2fa = staffTotal > 0 ? Math.round((staffWith2fa / staffTotal) * 100) : 0;

  const value: SecurityDashboardMetrics = {
    activeSessions,
    failedLoginAttempts,
    approvalsPending,
    highRiskCommands7d,
    lockedUsers,
    suspiciousNewIp: newIpEvents.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      severity: e.severity,
      user: e.user,
      metadata: e.metadata,
    })),
    staff: {
      total: staffTotal,
      with2fa: staffWith2fa,
      pct2fa,
      byRole: {
        OWNER: roleBuckets.get("OWNER") ?? { total: 0, with2fa: 0 },
        ADMIN: roleBuckets.get("ADMIN") ?? { total: 0, with2fa: 0 },
        MOD: roleBuckets.get("MOD") ?? { total: 0, with2fa: 0 },
        TRIAL_MOD: roleBuckets.get("TRIAL_MOD") ?? { total: 0, with2fa: 0 },
      },
    },
    recentFailedAttempts,
  };

  metricsCache.set(input.communityId, { at: nowMs, value });
  if (metricsCache.size > 2_000) metricsCache.clear();

  return value;
}
