import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const DEFAULT_OWNER_EMAIL = "mangukonto58@gmail.com";
const AUDIT_CHAIN_LOCK_KEY = 3182001;

function normalizeEmail(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v.length ? v : null;
}

function stableStringify(value) {
  if (value === null || value === undefined) return "null";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (t === "object") {
    const obj = value;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function computeAuditHash(input) {
  const eventData = stableStringify({
    chainIndex: input.chainIndex,
    communityId: input.communityId,
    userId: input.userId,
    eventType: input.eventType,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: input.metadata,
    createdAt: input.createdAt.toISOString(),
  });
  const seed = `${input.prevHash ?? ""}${eventData}`;
  return crypto.createHash("sha256").update(seed).digest("hex");
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const desiredEmail =
      normalizeEmail(process.env.OWNER_EMAIL) ?? normalizeEmail(DEFAULT_OWNER_EMAIL);

    const user =
      (desiredEmail
        ? await prisma.user.findUnique({
            where: { email: desiredEmail },
            select: { id: true, email: true, role: true, twoFactorEnabled: true },
          })
        : null) ??
      (await prisma.user.findFirst({
        where: { role: "OWNER" },
        select: { id: true, email: true, role: true, twoFactorEnabled: true },
      }));

    if (!user) {
      console.error("[owner-disable-2fa] No OWNER user found.");
      process.exitCode = 1;
      return;
    }

    const membership = await prisma.communityMembership.findFirst({
      where: { userId: user.id },
      select: { communityId: true },
      orderBy: { createdAt: "asc" },
    });
    const communityId = membership?.communityId ?? null;

    await prisma.$transaction(async (tx) => {
      // Remove 2FA material and invalidate sessions so next sign-in is clean.
      await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecretEnc: null,
          twoFactorPendingSecretEnc: null,
          twoFactorPendingCreatedAt: null,
        },
      });

      // Write a hashed-chain audit entry (break-glass).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY});`;
      const last = await tx.auditLog.findFirst({
        orderBy: { chainIndex: "desc" },
        select: { chainIndex: true, hash: true },
      });
      const chainIndex = (last?.chainIndex ?? 0) + 1;
      const prevHash = last?.hash ?? null;
      const createdAt = new Date();
      const metadata = {
        breakglass: true,
        reason: "owner_lost_2fa_device",
      };
      const hash = computeAuditHash({
        prevHash,
        chainIndex,
        communityId,
        userId: user.id,
        eventType: "2fa.disabled",
        ip: null,
        userAgent: null,
        metadata,
        createdAt,
      });

      await tx.auditLog.create({
        data: {
          chainIndex,
          prevHash,
          hash,
          communityId,
          userId: user.id,
          eventType: "2fa.disabled",
          metadataJson: metadata,
          createdAt,
        },
      });
    });

    console.log("");
    console.log("========================================");
    console.log("VSM OWNER 2FA DISABLED (BREAK-GLASS)");
    console.log("========================================");
    console.log(`Email: ${user.email}`);
    console.log("");
    console.log("Notes:");
    console.log("- Backup codes were deleted.");
    console.log("- Sessions were revoked (you must sign in again).");
    console.log("- After sign-in, re-enable 2FA in Profile > Security.");
    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

await main();

