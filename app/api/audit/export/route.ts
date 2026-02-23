import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { Permission } from "@/lib/security/permissions";
import { sanitizeMetadata } from "@/lib/security/privacy";
import { requirePermission } from "@/lib/services/auth";

function toCsvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  try {
    const actor = await requirePermission(Permission.AUDIT_READ);
    if (actor.membership.role.priority < ROLE_PRIORITY.ADMIN) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")?.trim() || undefined;
    const eventType = searchParams.get("eventType")?.trim() || undefined;
    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    const from = fromRaw ? new Date(fromRaw) : undefined;
    const to = toRaw ? new Date(toRaw) : undefined;

    const logs = await prisma.auditLog.findMany({
      where: {
        communityId: actor.communityId,
        ...(userId ? { userId } : {}),
        ...(eventType ? { eventType } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { chainIndex: "desc" },
      take: 5_000,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const lines = [
      ["timestamp", "chainIndex", "eventType", "actorName", "actorEmail", "metadata"].join(","),
      ...logs.map((log) =>
        [
          toCsvCell(log.createdAt.toISOString()),
          toCsvCell(log.chainIndex),
          toCsvCell(log.eventType),
          toCsvCell(log.user?.name ?? "System"),
          toCsvCell(log.user?.email ?? ""),
          toCsvCell(JSON.stringify(sanitizeMetadata(log.metadataJson))),
        ].join(","),
      ),
    ];

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="vsm-audit-${Date.now()}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
}

