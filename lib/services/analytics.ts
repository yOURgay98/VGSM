import { prisma } from "@/lib/db";
import { ROLE_PRIORITY } from "@/lib/permissions";

export async function getStaffActionCounts(input: { communityId: string; days?: number }) {
  const days = Math.min(Math.max(input.days ?? 14, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const memberships = await prisma.communityMembership.findMany({
    where: {
      communityId: input.communityId,
      role: { priority: { gte: ROLE_PRIORITY.TRIAL_MOD } },
      user: { disabledAt: null },
    },
    select: {
      user: { select: { id: true, name: true } },
      role: { select: { id: true, name: true, priority: true } },
    },
    orderBy: [{ role: { priority: "desc" } }, { user: { name: "asc" } }],
  });

  const counts = await prisma.action.groupBy({
    by: ["moderatorUserId"],
    where: { communityId: input.communityId, createdAt: { gte: since } },
    _count: { _all: true },
  });

  const byId = new Map(counts.map((row) => [row.moderatorUserId, row._count._all]));

  return memberships.map((m) => ({
    userId: m.user.id,
    name: m.user.name,
    roleName: m.role.name,
    count: byId.get(m.user.id) ?? 0,
  }));
}

export async function getAvgReportResolutionMinutes(input: { communityId: string; days?: number }) {
  const days = Math.min(Math.max(input.days ?? 14, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const reports = await prisma.report.findMany({
    where: {
      communityId: input.communityId,
      createdAt: { gte: since },
      status: { in: ["RESOLVED", "REJECTED"] },
    },
    select: { createdAt: true, updatedAt: true },
    take: 500,
    orderBy: { updatedAt: "desc" },
  });

  if (reports.length === 0) {
    return { minutes: null as number | null, sampleSize: 0 };
  }

  const durations = reports
    .map((r) => (r.updatedAt.getTime() - r.createdAt.getTime()) / 60000)
    .filter((m) => Number.isFinite(m) && m >= 0);

  if (durations.length === 0) {
    return { minutes: null as number | null, sampleSize: reports.length };
  }

  const total = durations.reduce((acc, v) => acc + v, 0);
  return { minutes: total / durations.length, sampleSize: durations.length };
}
