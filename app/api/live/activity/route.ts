import { NextResponse } from "next/server";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/services/auth";
import { resolveActiveCommunityId } from "@/lib/services/community";

export async function GET(request: Request) {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ events: [], nextSince: 0 });
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communityId = await resolveActiveCommunityId(sessionUser.id);
  if (!communityId) {
    return NextResponse.json({ events: [], nextSince: 0 });
  }

  const { searchParams } = new URL(request.url);
  const sinceRaw = searchParams.get("since");
  const since = sinceRaw ? Number.parseInt(sinceRaw, 10) : null;
  const hasSince = Number.isFinite(since) && (since ?? 0) > 0;

  const logs = await prisma.auditLog.findMany({
    where: {
      communityId,
      ...(hasSince ? { chainIndex: { gt: since as number } } : {}),
    },
    orderBy: { chainIndex: hasSince ? "asc" : "desc" },
    take: hasSince ? 40 : 30,
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  const ordered = hasSince ? logs : [...logs].reverse();
  const nextSince = ordered.length ? ordered[ordered.length - 1]!.chainIndex : (since ?? 0);

  return NextResponse.json({
    events: ordered.map((log) => ({
      id: log.id,
      chainIndex: log.chainIndex,
      createdAt: log.createdAt.toISOString(),
      eventType: log.eventType,
      user: log.user ? { id: log.user.id, name: log.user.name, role: log.user.role } : null,
      metadataJson: log.metadataJson,
    })),
    nextSince,
  });
}
