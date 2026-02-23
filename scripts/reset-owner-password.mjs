import "dotenv/config";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function generatePassword() {
  // Easy to read/paste, high entropy.
  // Example: VSM-RESET-3VYF-35SC-TRRZ
  const bytes = crypto.randomBytes(9).toString("base64url").toUpperCase();
  const chunked = bytes.replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const parts = chunked.match(/.{1,4}/g) ?? [chunked];
  return `VSM-RESET-${parts.join("-")}`;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const owner = await prisma.user.findFirst({
      where: { role: "OWNER" },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!owner) {
      console.error("[reset-owner-password] No OWNER user found in the database.");
      console.error(
        "[reset-owner-password] If this is a new database, start the app once with OWNER_EMAIL + OWNER_BOOTSTRAP_PASSWORD to bootstrap an owner.",
      );
      process.exitCode = 1;
      return;
    }

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: owner.id },
      data: {
        passwordHash,
        forceChangePassword: true,
        failedLoginCount: 0,
        lockedUntil: null,
        disabledAt: null,
      },
    });

    console.log("");
    console.log("========================================");
    console.log("VSM OWNER PASSWORD RESET (ONE-TIME)");
    console.log("========================================");
    console.log(`Email:    ${owner.email}`);
    console.log(`Password: ${password}`);
    console.log("");
    console.log("Next steps:");
    console.log("1) Sign in with the credentials above.");
    console.log("2) You will be forced to change your password immediately.");
    console.log("3) If 2FA is enabled, you still need your authenticator code.");
    console.log("");
  } finally {
    await prisma.$disconnect();
  }
}

await main();

