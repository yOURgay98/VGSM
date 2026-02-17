"use server";

import QRCode from "qrcode";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { requireSessionUser } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { encryptString, decryptString } from "@/lib/security/encryption";
import { buildOtpAuthUrl, generateTotpSecret, verifyTotp } from "@/lib/security/totp";
import {
  generateBackupCodes,
  replaceBackupCodes,
  consumeBackupCode,
} from "@/lib/services/two-factor";
import { getGeneralSettings } from "@/lib/services/settings";

export interface TwoFactorActionResult {
  success: boolean;
  message: string;
  secret?: string;
  qrCodeDataUrl?: string;
  backupCodes?: string[];
}

export async function startTwoFactorEnrollmentAction(
  _prev: TwoFactorActionResult,
  formData: FormData,
): Promise<TwoFactorActionResult> {
  const sessionUser = await requireSessionUser();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { success: false, message: "User record not found." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { success: false, message: "Incorrect password." };
  }

  if (user.twoFactorEnabled) {
    return { success: false, message: "Two-factor authentication is already enabled." };
  }

  let secret: string;
  try {
    secret = generateTotpSecret();
  } catch {
    return { success: false, message: "Unable to generate 2FA secret." };
  }

  const settings = await getGeneralSettings();
  const issuer = settings.communityName || "Vanguard Security & Management";
  const otpauthUrl = buildOtpAuthUrl({
    issuer,
    accountName: user.email,
    secret,
  });

  let qrCodeDataUrl: string;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, scale: 5 });
  } catch {
    return { success: false, message: "Unable to generate QR code." };
  }

  let pendingEnc: string;
  try {
    pendingEnc = encryptString(secret);
  } catch (error) {
    console.error("[2fa] Encryption unavailable.", error);
    return {
      success: false,
      message: "2FA encryption key is missing or invalid. Set AUTH_ENCRYPTION_KEY and retry.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorPendingSecretEnc: pendingEnc,
      twoFactorPendingCreatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.TWO_FACTOR_ENROLL_STARTED,
    metadata: { issuer },
  });

  return {
    success: true,
    message: "Scan the QR code in your authenticator app, then enter the 6-digit code to confirm.",
    secret,
    qrCodeDataUrl,
  };
}

export async function confirmTwoFactorEnrollmentAction(
  _prev: TwoFactorActionResult,
  formData: FormData,
): Promise<TwoFactorActionResult> {
  const sessionUser = await requireSessionUser();
  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { success: false, message: "User record not found." };
  }

  if (user.twoFactorEnabled) {
    return { success: false, message: "Two-factor authentication is already enabled." };
  }

  if (!user.twoFactorPendingSecretEnc) {
    return { success: false, message: "No pending enrollment found. Start setup again." };
  }

  let secret: string;
  try {
    secret = decryptString(user.twoFactorPendingSecretEnc);
  } catch {
    return { success: false, message: "Pending enrollment secret could not be decrypted." };
  }

  const valid = verifyTotp(code, secret);
  if (!valid) {
    return { success: false, message: "Invalid code. Try again." };
  }

  const backupCodes = generateBackupCodes(10);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecretEnc: user.twoFactorPendingSecretEnc,
        twoFactorPendingSecretEnc: null,
        twoFactorPendingCreatedAt: null,
      },
    });
  });
  await replaceBackupCodes(user.id, backupCodes);

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.TWO_FACTOR_ENABLED,
  });

  return {
    success: true,
    message: "Two-factor authentication enabled. Save your backup codes now.",
    backupCodes,
  };
}

export async function disableTwoFactorAction(
  _prev: TwoFactorActionResult,
  formData: FormData,
): Promise<TwoFactorActionResult> {
  const sessionUser = await requireSessionUser();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { success: false, message: "User record not found." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { success: false, message: "Incorrect password." };
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecretEnc) {
    return { success: false, message: "Two-factor authentication is not enabled." };
  }

  const secret = decryptString(user.twoFactorSecretEnc);
  const totpOk = verifyTotp(code, secret);
  const backupOk = totpOk
    ? false
    : await consumeBackupCode({
        userId: user.id,
        rawCode: code,
      });

  if (!totpOk && !backupOk) {
    return { success: false, message: "Invalid authenticator or backup code." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecretEnc: null,
        twoFactorPendingSecretEnc: null,
        twoFactorPendingCreatedAt: null,
      },
    });
    await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
  });

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.TWO_FACTOR_DISABLED,
  });

  return { success: true, message: "Two-factor authentication disabled." };
}

export async function regenerateBackupCodesAction(
  _prev: TwoFactorActionResult,
  formData: FormData,
): Promise<TwoFactorActionResult> {
  const sessionUser = await requireSessionUser();
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "").trim();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return { success: false, message: "User record not found." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { success: false, message: "Incorrect password." };
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecretEnc) {
    return { success: false, message: "Two-factor authentication is not enabled." };
  }

  const secret = decryptString(user.twoFactorSecretEnc);
  const totpOk = verifyTotp(code, secret);
  if (!totpOk) {
    return { success: false, message: "Invalid authenticator code." };
  }

  const backupCodes = generateBackupCodes(10);
  await replaceBackupCodes(user.id, backupCodes);

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.BACKUP_CODES_REGENERATED,
  });

  return {
    success: true,
    message: "Backup codes regenerated. Save them now.",
    backupCodes,
  };
}
