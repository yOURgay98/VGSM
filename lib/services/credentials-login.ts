import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { loginRateLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { decryptString } from "@/lib/security/encryption";
import { verifyTotp } from "@/lib/security/totp";
import { consumeBackupCode } from "@/lib/services/two-factor";
import { createSecurityEvent } from "@/lib/services/security-events";
import { bootstrapOwnerIfNeeded } from "@/lib/services/bootstrap-owner";
import { maskIpAddress, sanitizeUserAgent } from "@/lib/security/privacy";

type LoginCode =
  | "invalid_credentials"
  | "rate_limited"
  | "locked"
  | "disabled"
  | "2fa_required"
  | "2fa_invalid"
  | "service_unavailable";

export class CredentialsLoginError extends Error {
  code: LoginCode;

  constructor(code: LoginCode) {
    super(code);
    this.code = code;
  }
}

let authDatabaseUnavailableUntil = 0;
let lastAuthDatabaseErrorLoggedAt = 0;

const isLocalAuthRuntime =
  process.env.NEXTAUTH_URL?.includes("localhost") === true ||
  process.env.NEXTAUTH_URL?.includes("127.0.0.1") === true ||
  process.env.NODE_ENV !== "production";

const shouldEnforceLoginRateLimit =
  process.env.ENFORCE_LOGIN_RATE_LIMIT === "true" || !isLocalAuthRuntime;

function markAuthDatabaseUnavailable(error: unknown) {
  authDatabaseUnavailableUntil = Date.now() + 10_000;

  const now = Date.now();
  if (now - lastAuthDatabaseErrorLoggedAt > 10_000) {
    lastAuthDatabaseErrorLoggedAt = now;
    console.error("[auth] Database unavailable during login.", error);
  }
}

export async function verifyCredentialsLogin(input: {
  email: string;
  password: string;
  twoFactorCode?: string;
  ip: string | null;
  userAgent: string | null;
}) {
  const parsed = loginSchema.safeParse(input);
  const dbAvailable = Date.now() >= authDatabaseUnavailableUntil;
  const safeIp = maskIpAddress(input.ip);
  const safeUserAgent = sanitizeUserAgent(input.userAgent);

  if (!parsed.success) {
    if (dbAvailable) {
      await createAuditLog({
        eventType: AuditEvent.LOGIN_FAILED,
        ip: safeIp,
        userAgent: safeUserAgent,
        metadata: { reason: "invalid_payload" },
      });
    }
    throw new CredentialsLoginError("invalid_credentials");
  }

  const { email, password, twoFactorCode } = parsed.data;
  const identifier = `${safeIp ?? "unknown"}:${email}`;
  const rateLimit = shouldEnforceLoginRateLimit
    ? loginRateLimiter.check(identifier)
    : { allowed: true, remaining: Number.POSITIVE_INFINITY };

  if (!rateLimit.allowed) {
    if (dbAvailable) {
      await prisma.loginAttempt.create({
        data: { email, success: false, ip: safeIp, userAgent: safeUserAgent },
      });
      await createAuditLog({
        eventType: AuditEvent.LOGIN_FAILED,
        ip: safeIp,
        userAgent: safeUserAgent,
        metadata: { email, reason: "rate_limited" },
      });
    }
    throw new CredentialsLoginError("rate_limited");
  }

  if (!dbAvailable) {
    throw new CredentialsLoginError("service_unavailable");
  }

  // Login policy uses the default community's security settings (strict by default).
  const security = await getSecuritySettings();

  let user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  try {
    // If the database is empty, bootstrap a first OWNER account from env vars (or the login email)
    // so the app isn't stuck in "invalid credentials" forever.
    await bootstrapOwnerIfNeeded(email);
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    markAuthDatabaseUnavailable(error);
    throw new CredentialsLoginError("service_unavailable");
  }

  if (!user) {
    await prisma.loginAttempt.create({
      data: { email, success: false, ip: safeIp, userAgent: safeUserAgent },
    });
    await createAuditLog({
      eventType: AuditEvent.LOGIN_FAILED,
      ip: safeIp,
      userAgent: safeUserAgent,
      metadata: { email, reason: "user_not_found" },
    });
    throw new CredentialsLoginError("invalid_credentials");
  }

  const primaryCommunity = await prisma.communityMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { communityId: true },
  });
  const primaryCommunityId = primaryCommunity?.communityId ?? null;

  if (user.disabledAt) {
    await prisma.loginAttempt.create({
      data: { email, userId: user.id, success: false, ip: safeIp, userAgent: safeUserAgent },
    });
    await createAuditLog({
      userId: user.id,
      eventType: AuditEvent.LOGIN_FAILED,
      ip: safeIp,
      userAgent: safeUserAgent,
      metadata: { email, reason: "disabled" },
    });
    throw new CredentialsLoginError("disabled");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await prisma.loginAttempt.create({
      data: { email, userId: user.id, success: false, ip: safeIp, userAgent: safeUserAgent },
    });
    await createAuditLog({
      userId: user.id,
      eventType: AuditEvent.LOGIN_FAILED,
      ip: safeIp,
      userAgent: safeUserAgent,
      metadata: { email, reason: "locked" },
    });
    throw new CredentialsLoginError("locked");
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    const since = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);

    await prisma.loginAttempt.create({
      data: { email, userId: user.id, success: false, ip: safeIp, userAgent: safeUserAgent },
    });

    const failCount = await prisma.loginAttempt.count({
      where: { email, success: false, createdAt: { gte: since } },
    });

    const lockedUntil =
      failCount >= security.lockoutMaxAttempts
        ? new Date(Date.now() + security.lockoutDurationMinutes * 60_000)
        : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: failCount, lockedUntil },
    });

    await createAuditLog({
      userId: user.id,
      eventType: AuditEvent.LOGIN_FAILED,
      ip: safeIp,
      userAgent: safeUserAgent,
      metadata: { email, reason: "invalid_password" },
    });

    if (failCount >= 5) {
      const burstSince = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);
      const already = await prisma.securityEvent.findFirst({
        where: { userId: user.id, eventType: "login_failed_burst", createdAt: { gte: burstSince } },
        select: { id: true },
      });
      if (!already) {
        await createSecurityEvent({
          communityId: primaryCommunityId,
          userId: user.id,
          severity: lockedUntil ? "CRITICAL" : "HIGH",
          eventType: "login_failed_burst",
          metadata: {
            email,
            ip: safeIp,
            userAgent: safeUserAgent,
            failures: failCount,
            windowMinutes: security.lockoutWindowMinutes,
          },
        });
      }
    }

    if (lockedUntil) {
      throw new CredentialsLoginError("locked");
    }
    throw new CredentialsLoginError("invalid_credentials");
  }

  if (user.twoFactorEnabled) {
    if (!twoFactorCode || String(twoFactorCode).trim() === "") {
      await prisma.loginAttempt.create({
        data: { email, userId: user.id, success: false, ip: safeIp, userAgent: safeUserAgent },
      });

      const since = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);
      const failCount = await prisma.loginAttempt.count({
        where: { email, success: false, createdAt: { gte: since } },
      });
      const lockedUntil =
        failCount >= security.lockoutMaxAttempts
          ? new Date(Date.now() + security.lockoutDurationMinutes * 60_000)
          : null;
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: failCount, lockedUntil },
      });

      await createAuditLog({
        userId: user.id,
        eventType: AuditEvent.LOGIN_FAILED,
        ip: safeIp,
        userAgent: safeUserAgent,
        metadata: { email, reason: "2fa_required" },
      });

      if (failCount >= 5) {
        const burstSince = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);
        const already = await prisma.securityEvent.findFirst({
          where: {
            userId: user.id,
            eventType: "login_failed_burst",
            createdAt: { gte: burstSince },
          },
          select: { id: true },
        });
        if (!already) {
          await createSecurityEvent({
            communityId: primaryCommunityId,
            userId: user.id,
            severity: lockedUntil ? "CRITICAL" : "HIGH",
            eventType: "login_failed_burst",
            metadata: {
              email,
              ip: safeIp,
              userAgent: safeUserAgent,
              failures: failCount,
              windowMinutes: security.lockoutWindowMinutes,
              reason: "2fa_required",
            },
          });
        }
      }

      if (lockedUntil) {
        throw new CredentialsLoginError("locked");
      }
      throw new CredentialsLoginError("2fa_required");
    }

    if (!user.twoFactorSecretEnc) {
      throw new CredentialsLoginError("service_unavailable");
    }

    const secret = decryptString(user.twoFactorSecretEnc);
    const totpValid = verifyTotp(String(twoFactorCode), secret);

    if (!totpValid) {
      const backupOk = await consumeBackupCode({
        userId: user.id,
        rawCode: String(twoFactorCode),
        ip: safeIp,
        userAgent: safeUserAgent,
      });

      if (!backupOk) {
        await prisma.loginAttempt.create({
          data: {
            email,
            userId: user.id,
            success: false,
            ip: safeIp,
            userAgent: safeUserAgent,
          },
        });

        const since = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);
        const failCount = await prisma.loginAttempt.count({
          where: { email, success: false, createdAt: { gte: since } },
        });
        const lockedUntil =
          failCount >= security.lockoutMaxAttempts
            ? new Date(Date.now() + security.lockoutDurationMinutes * 60_000)
            : null;
        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: failCount, lockedUntil },
        });

        await createAuditLog({
          userId: user.id,
          eventType: AuditEvent.LOGIN_FAILED,
          ip: safeIp,
          userAgent: safeUserAgent,
          metadata: { email, reason: "2fa_invalid" },
        });

        if (failCount >= 5) {
          const burstSince = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);
          const already = await prisma.securityEvent.findFirst({
            where: {
              userId: user.id,
              eventType: "login_failed_burst",
              createdAt: { gte: burstSince },
            },
            select: { id: true },
          });
          if (!already) {
            await createSecurityEvent({
              communityId: primaryCommunityId,
              userId: user.id,
              severity: lockedUntil ? "CRITICAL" : "HIGH",
              eventType: "login_failed_burst",
              metadata: {
                email,
                ip: safeIp,
                userAgent: safeUserAgent,
                failures: failCount,
                windowMinutes: security.lockoutWindowMinutes,
                reason: "2fa_invalid",
              },
            });
          }
        }

        if (lockedUntil) {
          throw new CredentialsLoginError("locked");
        }
        throw new CredentialsLoginError("2fa_invalid");
      }
    }
  }

  if (safeIp) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
    const seen = await prisma.loginAttempt.count({
      where: { userId: user.id, success: true, ip: safeIp, createdAt: { gte: since } },
    });
    if (seen === 0) {
      await createSecurityEvent({
        communityId: primaryCommunityId,
        userId: user.id,
        severity: "MEDIUM",
        eventType: "login_new_ip",
        metadata: { ip: safeIp, userAgent: safeUserAgent, email, windowDays: 30 },
      });
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    });
  } catch (error) {
    markAuthDatabaseUnavailable(error);
    throw new CredentialsLoginError("service_unavailable");
  }

  await prisma.loginAttempt.create({
    data: { email, userId: user.id, success: true, ip: safeIp, userAgent: safeUserAgent },
  });

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.LOGIN_SUCCESS,
    ip: safeIp,
    userAgent: safeUserAgent,
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

