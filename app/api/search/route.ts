import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { getSessionUser } from "@/lib/services/auth";
import { getCommunityAuthContext, resolveActiveCommunityId } from "@/lib/services/community";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communityId = await resolveActiveCommunityId(sessionUser.id);
  if (!communityId) {
    return NextResponse.json({ error: "No active community" }, { status: 403 });
  }
  const ctx = await getCommunityAuthContext({ userId: sessionUser.id, communityId });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ players: [], cases: [], reports: [], users: [], actions: [] });
  }

  const canUsersRead = ctx.permissions.includes(Permission.USERS_READ);
  const canActionsRead = ctx.permissions.includes(Permission.ACTIONS_CREATE);

  const [players, cases, reports, users, actions] = await Promise.all([
    prisma.player.findMany({
      where: { communityId, name: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true, status: true },
    }),
    prisma.case.findMany({
      where: { communityId, title: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, title: true, status: true },
    }),
    prisma.report.findMany({
      where: { communityId, summary: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, status: true, summary: true },
    }),
    canUsersRead
      ? prisma.communityMembership.findMany({
          where: {
            communityId,
            user: { name: { contains: query, mode: "insensitive" } },
          },
          take: 5,
          orderBy: { user: { name: "asc" } },
          select: {
            user: { select: { id: true, name: true, email: true } },
            role: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    canActionsRead
      ? prisma.action.findMany({
          where: {
            communityId,
            OR: [
              { reason: { contains: query, mode: "insensitive" } },
              { player: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            type: true,
            createdAt: true,
            player: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    players,
    cases,
    reports,
    users: users.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      role: row.role.name,
    })),
    actions: actions.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
