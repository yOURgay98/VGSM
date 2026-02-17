"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { decryptString } from "@/lib/security/encryption";
import { verifyTotp } from "@/lib/security/totp";
import { consumeBackupCode } from "@/lib/services/two-factor";
import { requireSessionUser } from "@/lib/services/auth";
import { getCurrentSessionToken } from "@/lib/services/session";
import { enableSensitiveMode, disableSensitiveMode } from "@/lib/services/sensitive-mode";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

const schema = z
  .object({
    password: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
  })
  .refine((val) => Boolean(val.password || val.code), {
    message: "Enter your password or a 2FA/backup code.",
  });

function getRequestMeta(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function enableSensitiveModeAction(
  _prevState: { success: boolean; message: string; expiresAt?: string | null },
  formData: FormData,
) {
  const user = await requireSessionUser();
  const token = await getCurrentSessionToken();
  if (!token) {
    return { success: false, message: "Session token missing. Try signing out and back in." };
  }

  const parsed = schema.safeParse({
    password: formData.get("password"),
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid payload." };
  }

  const [dbUser, security] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecretEnc: true,
      },
    }),
    getSecuritySettings(),
  ]);

  if (!dbUser) {
    return { success: false, message: "User record missing." };
  }

  const { password, code } = parsed.data;
  let verified = false;

  if (password) {
    verified = await verifyPassword(password, dbUser.passwordHash);
  }

  if (!verified && code) {
    if (dbUser.twoFactorEnabled && dbUser.twoFactorSecretEnc && process.env.AUTH_ENCRYPTION_KEY) {
      try {
        const secret = decryptString(dbUser.twoFactorSecretEnc);
        verified = verifyTotp(code, secret);
      } catch {
        // Ignore.
      }
    }

    if (!verified) {
      const h = await headers();
      const { ip, userAgent } = getRequestMeta(h);
      verified = await consumeBackupCode({ userId: user.id, rawCode: code, ip, userAgent });
    }
  }

  if (!verified) {
    return { success: false, message: "Verification failed." };
  }

  const ttl = Math.max(1, Math.min(120, security.sensitiveModeTtlMinutes));
  const grant = await enableSensitiveMode({
    userId: user.id,
    sessionToken: token,
    ttlMinutes: ttl,
  });

  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);
  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.SENSITIVE_MODE_ENABLED,
    ip,
    userAgent,
    metadata: { expiresAt: grant.expiresAt.toISOString(), ttlMinutes: ttl },
  });

  return {
    success: true,
    message: "Sensitive mode enabled.",
    expiresAt: grant.expiresAt.toISOString(),
  };
}

export async function disableSensitiveModeAction() {
  const user = await requireSessionUser();
  const token = await getCurrentSessionToken();
  if (!token) {
    return { success: false, message: "Session token missing." };
  }

  await disableSensitiveMode({ userId: user.id, sessionToken: token });

  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);
  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.SENSITIVE_MODE_DISABLED,
    ip,
    userAgent,
  });

  return { success: true, message: "Sensitive mode disabled." };
}
