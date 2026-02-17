import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

const KEY_PREFIX = "VSM-ACCESS";
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids ambiguous chars
const KEY_GROUPS = 4;
const KEY_GROUP_LEN = 4;
const KEY_COMPARE_MAX_CANDIDATES = 250;

function pickAlphabetChar(byte: number) {
  return KEY_ALPHABET[byte % KEY_ALPHABET.length] ?? "A";
}

export function generateBetaAccessKey() {
  const totalChars = KEY_GROUPS * KEY_GROUP_LEN;
  const bytes = randomBytes(totalChars);
  const chars = Array.from(bytes, (b) => pickAlphabetChar(b));

  const groups: string[] = [];
  for (let i = 0; i < KEY_GROUPS; i += 1) {
    groups.push(chars.slice(i * KEY_GROUP_LEN, (i + 1) * KEY_GROUP_LEN).join(""));
  }

  return `${KEY_PREFIX}-${groups.join("-")}`;
}

function normalizeKey(raw: string) {
  return raw.trim().toUpperCase();
}

function now() {
  return new Date();
}

export type BetaAccessKeyListRow = {
  id: string;
  label: string | null;
  maxUses: number;
  uses: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  createdByUser: { id: string; name: string; email: string } | null;
};

export async function listBetaAccessKeys(input: {
  communityId: string;
}): Promise<BetaAccessKeyListRow[]> {
  const rows = await prisma.betaAccessKey.findMany({
    where: { communityId: input.communityId },
    orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      maxUses: true,
      uses: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      createdByUser: { select: { id: true, name: true, email: true } },
    },
    take: 250,
  });

  return rows;
}

export async function createBetaAccessKey(input: {
  communityId: string;
  actorUserId: string;
  label?: string | null;
  maxUses: number;
  expiresAt?: Date | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const label = input.label?.trim() ? input.label.trim().slice(0, 80) : null;
  const maxUses =
    Number.isFinite(input.maxUses) && input.maxUses > 0
      ? Math.min(Math.floor(input.maxUses), 500)
      : 1;
  const expiresAt = input.expiresAt ?? null;

  const rawKey = generateBetaAccessKey();
  const keyHash = await bcrypt.hash(normalizeKey(rawKey), 12);

  const created = await prisma.betaAccessKey.create({
    data: {
      communityId: input.communityId,
      keyHash,
      label,
      maxUses,
      expiresAt,
      createdByUserId: input.actorUserId,
    },
    select: { id: true, createdAt: true },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.BETA_KEY_CREATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      betaKeyId: created.id,
      label,
      maxUses,
      expiresAt,
    } as unknown as Prisma.InputJsonValue,
  });

  return {
    id: created.id,
    key: rawKey,
    createdAt: created.createdAt,
    label,
    maxUses,
    expiresAt,
  };
}

export async function revokeBetaAccessKey(input: {
  communityId: string;
  actorUserId: string;
  betaKeyId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.betaAccessKey.updateMany({
    where: { id: input.betaKeyId, communityId: input.communityId, revokedAt: null },
    data: { revokedAt: now() },
  });

  if (updated.count !== 1) {
    throw new Error("Beta key not found.");
  }

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.BETA_KEY_REVOKED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { betaKeyId: input.betaKeyId } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true as const };
}

export async function consumeBetaAccessKey(
  input: {
    communityId: string;
    actorUserId: string;
    key: string;
    ip?: string | null;
    userAgent?: string | null;
  },
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  const raw = normalizeKey(input.key);
  if (!raw || raw.length < 12) {
    throw new Error("Invalid access key.");
  }

  const candidates = await client.betaAccessKey.findMany({
    where: {
      communityId: input.communityId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now() } }],
    },
    select: { id: true, keyHash: true, maxUses: true, uses: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
    take: KEY_COMPARE_MAX_CANDIDATES,
  });

  for (const candidate of candidates) {
    if (candidate.uses >= candidate.maxUses) continue;
    const match = await bcrypt.compare(raw, candidate.keyHash);
    if (!match) continue;

    // Concurrency-safe consume: only increment if the key is still active and has remaining uses.
    const updated = await client.betaAccessKey.updateMany({
      where: {
        id: candidate.id,
        communityId: input.communityId,
        revokedAt: null,
        uses: { lt: candidate.maxUses },
        ...(candidate.expiresAt ? { expiresAt: { gt: now() } } : {}),
      },
      data: { uses: { increment: 1 } },
    });

    if (updated.count !== 1) {
      // Lost the race; try the next candidate.
      continue;
    }

    await createAuditLog(
      {
        userId: input.actorUserId,
        communityId: input.communityId,
        eventType: AuditEvent.BETA_KEY_REDEEMED,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: { betaKeyId: candidate.id } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { ok: true as const, betaKeyId: candidate.id };
  }

  throw new Error("Invalid access key.");
}
