import { NextResponse } from "next/server";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { prisma } from "@/lib/db";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { getSessionUser } from "@/lib/services/auth";
import { resolveActiveCommunityId } from "@/lib/services/community";

const ONLINE_WINDOW_MINUTES = 5;

export async function GET() {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ staff: [] });
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communityId = await resolveActiveCommunityId(sessionUser.id);
  if (!communityId) {
    return NextResponse.json({ staff: [] });
  }
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60_000);

  const sessions = await prisma.session.findMany({
    where: {
      activeCommunityId: communityId,
      lastActiveAt: { gte: cutoff },
      user: {
        disabledAt: null,
      },
    },
    select: {
      userId: true,
      lastActiveAt: true,
      currentPath: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { lastActiveAt: "desc" },
    take: 250,
  });

  const byUser = new Map<
    string,
    {
      userId: string;
      name: string;
      sessionCount: number;
      lastActiveAt: Date;
      currentPath: string | null;
    }
  >();

  for (const s of sessions) {
    const existing = byUser.get(s.userId);
    if (!existing) {
      byUser.set(s.userId, {
        userId: s.userId,
        name: s.user.name,
        sessionCount: 1,
        lastActiveAt: s.lastActiveAt,
        currentPath: s.currentPath ?? null,
      });
      continue;
    }
    existing.sessionCount += 1;
    if (s.lastActiveAt > existing.lastActiveAt) {
      existing.lastActiveAt = s.lastActiveAt;
      existing.currentPath = s.currentPath ?? existing.currentPath;
    }
  }

  const roleRows = await prisma.communityMembership.findMany({
    where: {
      communityId,
      userId: { in: Array.from(byUser.keys()) },
      role: { priority: { gte: ROLE_PRIORITY.TRIAL_MOD } },
    },
    select: { userId: true, role: { select: { name: true, priority: true } } },
  });
  const roleByUser = new Map(roleRows.map((row) => [row.userId, row.role] as const));

  const staff = Array.from(byUser.values())
    .filter((entry) => roleByUser.has(entry.userId))
    .map((entry) => ({
      ...entry,
      role: roleByUser.get(entry.userId)!.name,
      rolePriority: roleByUser.get(entry.userId)!.priority,
    }))
    .sort((a, b) => {
      const roleDiff = b.rolePriority - a.rolePriority;
      if (roleDiff !== 0) return roleDiff;
      return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
    });

  return NextResponse.json({
    staff: staff.map((entry) => ({
      userId: entry.userId,
      name: entry.name,
      role: entry.role,
      sessionCount: entry.sessionCount,
      currentPath: entry.currentPath,
      lastActiveAt: entry.lastActiveAt.toISOString(),
    })),
    windowMinutes: ONLINE_WINDOW_MINUTES,
  });
}
