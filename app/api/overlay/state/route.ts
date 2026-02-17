import { NextResponse } from "next/server";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { getSessionUser } from "@/lib/services/auth";
import { getCommunityAuthContext, resolveActiveCommunityId } from "@/lib/services/community";

export async function GET() {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({
      now: { openReports: 0, triageReports: 0, pendingApprovals: 0, activeSessions: 0 },
      inbox: { reports: [], cases: [] },
      assignedReports: [],
      recentPlayers: [],
      assignedCases: [],
      approvals: { canDecide: false, pendingCount: 0, pending: [] },
    });
  }

  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communityId = await resolveActiveCommunityId(userId);
  if (!communityId) {
    return NextResponse.json({
      now: { openReports: 0, triageReports: 0, pendingApprovals: 0, activeSessions: 0 },
      inbox: { reports: [], cases: [] },
      assignedReports: [],
      recentPlayers: [],
      assignedCases: [],
      approvals: { canDecide: false, pendingCount: 0, pending: [] },
    });
  }
  const ctx = await getCommunityAuthContext({ userId, communityId });
  const canDecideApprovals = ctx.permissions.includes(Permission.APPROVALS_DECIDE);
  const activeCutoff = new Date(Date.now() - 5 * 60_000);

  const [
    recentActions,
    assignedCases,
    assignedReports,
    triageReports,
    triageCases,
    pendingApprovalCount,
    pendingApprovals,
    openReportsCount,
    triageReportsCount,
    activeSessionsCount,
  ] = await Promise.all([
    prisma.action.findMany({
      where: { communityId, moderatorUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        createdAt: true,
        player: { select: { id: true, name: true, status: true } },
      },
    }),
    prisma.case.findMany({
      where: { communityId, assignedToUserId: userId, status: { in: ["OPEN", "IN_REVIEW"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.report.findMany({
      where: { communityId, assignedToUserId: userId, status: { in: ["OPEN", "IN_REVIEW"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        summary: true,
        createdAt: true,
        accusedPlayer: { select: { id: true, name: true, status: true } },
      },
    }),
    prisma.report.findMany({
      where: {
        communityId,
        assignedToUserId: null,
        status: { in: ["OPEN", "IN_REVIEW"] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        status: true,
        summary: true,
        createdAt: true,
        accusedPlayer: { select: { id: true, name: true, status: true } },
      },
    }),
    prisma.case.findMany({
      where: {
        communityId,
        assignedToUserId: null,
        status: { in: ["OPEN", "IN_REVIEW"] },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 8,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
    prisma.approvalRequest.count({
      where: canDecideApprovals
        ? { communityId, status: "PENDING" }
        : { communityId, status: "PENDING", requestedByUserId: userId },
    }),
    prisma.approvalRequest.findMany({
      where: canDecideApprovals
        ? { communityId, status: "PENDING" }
        : { communityId, status: "PENDING", requestedByUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        requestedByUser: { select: { id: true, name: true, role: true } },
        payloadJson: true,
      },
    }),
    prisma.report.count({
      where: { communityId, status: { in: ["OPEN", "IN_REVIEW"] } },
    }),
    prisma.report.count({
      where: { communityId, assignedToUserId: null, status: { in: ["OPEN", "IN_REVIEW"] } },
    }),
    prisma.session.count({
      where: {
        activeCommunityId: communityId,
        lastActiveAt: { gte: activeCutoff },
        user: { disabledAt: null },
      },
    }),
  ]);

  const seen = new Set<string>();
  const recentPlayers = [];
  for (const action of recentActions) {
    if (seen.has(action.player.id)) continue;
    seen.add(action.player.id);
    recentPlayers.push({
      id: action.player.id,
      name: action.player.name,
      status: action.player.status,
      lastAt: action.createdAt.toISOString(),
    });
    if (recentPlayers.length >= 8) break;
  }

  return NextResponse.json({
    now: {
      openReports: openReportsCount,
      triageReports: triageReportsCount,
      pendingApprovals: pendingApprovalCount,
      activeSessions: activeSessionsCount,
    },
    inbox: {
      reports: triageReports.map((r) => ({
        id: r.id,
        status: r.status,
        summary: r.summary,
        createdAt: r.createdAt.toISOString(),
        accusedPlayer: r.accusedPlayer,
      })),
      cases: triageCases.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    assignedReports: assignedReports.map((r) => ({
      id: r.id,
      status: r.status,
      summary: r.summary,
      createdAt: r.createdAt.toISOString(),
      accusedPlayer: r.accusedPlayer,
    })),
    recentPlayers,
    assignedCases: assignedCases.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      updatedAt: c.updatedAt.toISOString(),
    })),
    approvals: {
      canDecide: canDecideApprovals,
      pendingCount: pendingApprovalCount,
      pending: pendingApprovals.map((a) => ({
        id: a.id,
        riskLevel: a.riskLevel,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        requestedByUser: a.requestedByUser,
        payloadJson: a.payloadJson,
      })),
    },
  });
}
