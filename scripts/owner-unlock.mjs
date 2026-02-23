import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const DEFAULT_OWNER_EMAIL = "mangukonto58@gmail.com";

function normalizeEmail(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v.length ? v : null;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const desiredEmail = normalizeEmail(process.env.OWNER_EMAIL) ?? normalizeEmail(DEFAULT_OWNER_EMAIL);

    const user =
      (desiredEmail
        ? await prisma.user.findUnique({
            where: { email: desiredEmail },
            select: { id: true, email: true, role: true, lockedUntil: true, failedLoginCount: true },
          })
        : null) ??
      (await prisma.user.findFirst({
        where: { role: "OWNER" },
        select: { id: true, email: true, role: true, lockedUntil: true, failedLoginCount: true },
      }));

    if (!user) {
      console.error("[owner-unlock] No OWNER user found.");
      process.exitCode = 1;
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lockedUntil: null,
        failedLoginCount: 0,
      },
    });

    console.log("");
    console.log("========================================");
    console.log("VSM OWNER UNLOCKED");
    console.log("========================================");
    console.log(`Email: ${user.email}`);
    console.log("");
    console.log("Notes:");
    console.log("- Account lock was cleared (lockedUntil -> null, failedLoginCount -> 0).");
    console.log("- If you still see 'locked', you're likely resetting a different DATABASE_URL than the site is using.");
    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

await main();

