import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function generateRawCode() {
  // 10 hex chars (case-insensitive), safe to type.
  return randomBytes(5).toString("hex").toUpperCase();
}

export function generateBackupCodes(count = 10) {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    codes.push(generateRawCode());
  }
  return codes;
}

export async function replaceBackupCodes(userId: string, codes: string[]) {
  await prisma.$transaction(async (tx) => {
    await tx.twoFactorBackupCode.deleteMany({ where: { userId } });
    await tx.twoFactorBackupCode.createMany({
      data: await Promise.all(
        codes.map(async (code) => ({ userId, codeHash: await hashPassword(code) })),
      ),
    });
  });
}

export async function consumeBackupCode(input: {
  userId: string;
  rawCode: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const code = input.rawCode.trim().toUpperCase();
  if (code.length < 8) {
    return false;
  }

  const candidates = await prisma.twoFactorBackupCode.findMany({
    where: { userId: input.userId, usedAt: null },
    select: { id: true, codeHash: true },
    take: 20,
  });

  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await verifyPassword(code, candidate.codeHash);
    if (!ok) continue;

    const updated = await prisma.twoFactorBackupCode.updateMany({
      where: { id: candidate.id, usedAt: null },
      data: {
        usedAt: new Date(),
        usedFromIp: input.ip ?? null,
        usedUserAgent: input.userAgent ?? null,
      },
    });

    if (updated.count > 0) {
      return true;
    }
  }

  return false;
}
