import { prisma } from "@/lib/db";
import { clampTake } from "@/lib/db/pagination";
import { computeAuditHash } from "@/lib/security/audit-hash";

interface AuditFilter {
  userId?: string;
  eventType?: string;
  from?: Date;
  to?: Date;
}

export interface AuditIntegrityStatus {
  ok: boolean;
  partial: boolean;
  firstBrokenChainIndex?: number;
}

export async function listAuditLogs(input: {
  communityId: string;
  filter?: AuditFilter;
  take?: number;
  cursor?: number | null;
}) {
  const filter = input.filter ?? {};
  const take = clampTake(input.take, { defaultTake: 140, maxTake: 300 });

  const rows = await prisma.auditLog.findMany({
    where: {
      communityId: input.communityId,
      userId: filter.userId,
      eventType: filter.eventType,
      createdAt:
        filter.from || filter.to
          ? {
              gte: filter.from,
              lte: filter.to,
            }
          : undefined,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { chainIndex: "desc" },
    take: take + 1,
    ...(input.cursor ? { cursor: { chainIndex: input.cursor }, skip: 1 } : {}),
  });

  const logs = rows.slice(0, take);
  const nextCursor = rows.length > take ? (logs[logs.length - 1]?.chainIndex ?? null) : null;

  const integrity = verifyAuditIntegrity(logs);

  return { logs, integrity, nextCursor: nextCursor ? String(nextCursor) : null };
}

export function verifyAuditIntegrity(
  logs: Array<{
    chainIndex: number;
    prevHash: string | null;
    hash: string | null;
    communityId?: string | null;
    userId: string | null;
    eventType: string;
    ip: string | null;
    userAgent: string | null;
    metadataJson: unknown | null;
    createdAt: Date;
  }>,
): AuditIntegrityStatus {
  const hashed = logs
    .filter((log) => typeof log.hash === "string" && log.hash.length > 0)
    .sort((a, b) => a.chainIndex - b.chainIndex);

  if (hashed.length === 0) {
    return { ok: true, partial: true };
  }

  let expectedPrevHash: string | null = null;
  const partial = hashed[0]?.prevHash !== null; // if chain starts before this window

  for (const log of hashed) {
    if (log.prevHash !== expectedPrevHash) {
      return { ok: false, partial: false, firstBrokenChainIndex: log.chainIndex };
    }

    const expectedHash = computeAuditHash({
      prevHash: log.prevHash,
      chainIndex: log.chainIndex,
      communityId: log.communityId ?? null,
      userId: log.userId,
      eventType: log.eventType,
      ip: log.ip,
      userAgent: log.userAgent,
      metadata: (log.metadataJson ?? null) as any,
      createdAt: log.createdAt,
    });

    if (log.hash !== expectedHash) {
      return { ok: false, partial: false, firstBrokenChainIndex: log.chainIndex };
    }

    expectedPrevHash = log.hash;
  }

  return { ok: true, partial };
}
