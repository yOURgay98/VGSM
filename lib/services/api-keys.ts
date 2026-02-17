import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/security/api-key";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export type ApiKeyPermissionList = readonly string[];

export function normalizeApiKeyPermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
  }
  return Array.from(new Set(out));
}

export async function createApiKey(input: {
  communityId: string;
  actorUserId: string;
  name: string;
  permissions: ApiKeyPermissionList;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) {
    throw new Error("API key name must be 2-60 characters.");
  }

  const { key, keyHash } = generateApiKey();
  const permissions = Array.from(new Set(Array.from(input.permissions)));

  const record = await prisma.apiKey.create({
    data: {
      communityId: input.communityId,
      name,
      keyHash,
      permissionsJson: permissions as unknown as Prisma.InputJsonValue,
      createdByUserId: input.actorUserId,
    },
    select: { id: true },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.API_KEY_CREATED,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { apiKeyId: record.id, name, permissions } as unknown as Prisma.InputJsonValue,
  });

  return { id: record.id, key };
}

export async function listApiKeys(input: { communityId: string }) {
  return prisma.apiKey.findMany({
    where: { communityId: input.communityId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      createdAt: true,
      revokedAt: true,
      createdByUser: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function revokeApiKey(input: {
  communityId: string;
  actorUserId: string;
  apiKeyId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.apiKey.updateMany({
    where: { id: input.apiKeyId, communityId: input.communityId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (updated.count !== 1) {
    throw new Error("API key not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.API_KEY_REVOKED,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { apiKeyId: input.apiKeyId } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true } as const;
}
