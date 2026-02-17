import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import type { Provider } from "next-auth/providers";

import { prisma } from "@/lib/db";
import { assertServerEnv } from "@/lib/env/validate";
import { verifyPassword } from "@/lib/auth/password";
import { loginRateLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { decryptString } from "@/lib/security/encryption";
import { verifyTotp } from "@/lib/security/totp";
import { consumeBackupCode } from "@/lib/services/two-factor";
import { upsertDiscordAccount } from "@/lib/services/discord";

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
assertServerEnv();
if (process.env.NODE_ENV === "production" && !AUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET (or AUTH_SECRET) in production.");
}
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV !== "production") {
  console.warn("[auth] NEXTAUTH_URL is not set. Using host-derived URLs for local development.");
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

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

class LockedError extends CredentialsSignin {
  code = "locked";
}

class DisabledError extends CredentialsSignin {
  code = "disabled";
}

class TwoFactorRequiredError extends CredentialsSignin {
  code = "2fa_required";
}

class TwoFactorInvalidError extends CredentialsSignin {
  code = "2fa_invalid";
}

class ServiceUnavailableError extends CredentialsSignin {
  code = "service_unavailable";
}

const providers: Provider[] = [
  Credentials({
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      twoFactorCode: { label: "2FA code", type: "text" },
    },
    async authorize(credentials, request) {
      const parsed = loginSchema.safeParse(credentials);
      const dbAvailable = Date.now() >= authDatabaseUnavailableUntil;

      const ip =
        request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request?.headers.get("x-real-ip") ??
        null;
      const userAgent = request?.headers.get("user-agent") ?? null;

      if (!parsed.success) {
        if (dbAvailable) {
          await createAuditLog({
            eventType: AuditEvent.LOGIN_FAILED,
            ip,
            userAgent,
            metadata: { reason: "invalid_payload" },
          });
        }
        throw new InvalidCredentialsError();
      }

      const { email, password, twoFactorCode } = parsed.data;
      const identifier = `${ip ?? "unknown"}:${email}`;
      const rateLimit = shouldEnforceLoginRateLimit
        ? loginRateLimiter.check(identifier)
        : { allowed: true, remaining: Number.POSITIVE_INFINITY };

      if (!rateLimit.allowed) {
        if (dbAvailable) {
          await prisma.loginAttempt.create({
            data: {
              email,
              success: false,
              ip,
              userAgent,
            },
          });
          await createAuditLog({
            eventType: AuditEvent.LOGIN_FAILED,
            ip,
            userAgent,
            metadata: { email, reason: "rate_limited" },
          });
        }
        throw new RateLimitedError();
      }

      if (!dbAvailable) {
        throw new ServiceUnavailableError();
      }

      let user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
      try {
        user = await prisma.user.findUnique({ where: { email } });
      } catch (error) {
        markAuthDatabaseUnavailable(error);
        throw new ServiceUnavailableError();
      }

      if (!user) {
        await prisma.loginAttempt.create({
          data: {
            email,
            success: false,
            ip,
            userAgent,
          },
        });
        await createAuditLog({
          eventType: AuditEvent.LOGIN_FAILED,
          ip,
          userAgent,
          metadata: { email, reason: "user_not_found" },
        });
        throw new InvalidCredentialsError();
      }

      if (user.disabledAt) {
        await prisma.loginAttempt.create({
          data: {
            email,
            userId: user.id,
            success: false,
            ip,
            userAgent,
          },
        });
        await createAuditLog({
          userId: user.id,
          eventType: AuditEvent.LOGIN_FAILED,
          ip,
          userAgent,
          metadata: { email, reason: "disabled" },
        });
        throw new DisabledError();
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await prisma.loginAttempt.create({
          data: {
            email,
            userId: user.id,
            success: false,
            ip,
            userAgent,
          },
        });
        await createAuditLog({
          userId: user.id,
          eventType: AuditEvent.LOGIN_FAILED,
          ip,
          userAgent,
          metadata: { email, reason: "locked" },
        });
        throw new LockedError();
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);

      if (!passwordValid) {
        const security = await getSecuritySettings();
        const since = new Date(Date.now() - security.lockoutWindowMinutes * 60_000);

        await prisma.loginAttempt.create({
          data: {
            email,
            userId: user.id,
            success: false,
            ip,
            userAgent,
          },
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
          data: {
            failedLoginCount: failCount,
            lockedUntil,
          },
        });

        await createAuditLog({
          userId: user.id,
          eventType: AuditEvent.LOGIN_FAILED,
          ip,
          userAgent,
          metadata: { email, reason: "invalid_password" },
        });
        if (lockedUntil) {
          throw new LockedError();
        }
        throw new InvalidCredentialsError();
      }

      if (user.twoFactorEnabled) {
        if (!twoFactorCode || String(twoFactorCode).trim() === "") {
          await createAuditLog({
            userId: user.id,
            eventType: AuditEvent.LOGIN_FAILED,
            ip,
            userAgent,
            metadata: { email, reason: "2fa_required" },
          });
          throw new TwoFactorRequiredError();
        }

        if (!user.twoFactorSecretEnc) {
          throw new ServiceUnavailableError();
        }

        const secret = decryptString(user.twoFactorSecretEnc);
        const totpValid = verifyTotp(String(twoFactorCode), secret);

        if (!totpValid) {
          const backupOk = await consumeBackupCode({
            userId: user.id,
            rawCode: String(twoFactorCode),
            ip,
            userAgent,
          });

          if (!backupOk) {
            await prisma.loginAttempt.create({
              data: {
                email,
                userId: user.id,
                success: false,
                ip,
                userAgent,
              },
            });

            await createAuditLog({
              userId: user.id,
              eventType: AuditEvent.LOGIN_FAILED,
              ip,
              userAgent,
              metadata: { email, reason: "2fa_invalid" },
            });

            throw new TwoFactorInvalidError();
          }
        }
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginCount: 0,
            lockedUntil: null,
          },
        });
      } catch (error) {
        markAuthDatabaseUnavailable(error);
        throw new ServiceUnavailableError();
      }

      await prisma.loginAttempt.create({
        data: {
          email,
          userId: user.id,
          success: true,
          ip,
          userAgent,
        },
      });

      await createAuditLog({
        userId: user.id,
        eventType: AuditEvent.LOGIN_SUCCESS,
        ip,
        userAgent,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
  }),
];

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: {
    strategy: "database",
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
      }
      return session;
    },
  },
  events: {
    async linkAccount(message) {
      try {
        const account = (message as any).account as
          | { provider: string; providerAccountId: string }
          | undefined;
        if (!account || account.provider !== "discord") return;
        const user = (message as any).user as { id: string } | undefined;
        if (!user?.id) return;
        const profile = (message as any).profile as any;

        await upsertDiscordAccount({
          userId: user.id,
          discordUserId: String(account.providerAccountId),
          username: typeof profile?.username === "string" ? profile.username : null,
          discriminator: typeof profile?.discriminator === "string" ? profile.discriminator : null,
          avatar: typeof profile?.avatar === "string" ? profile.avatar : null,
        });

        await createAuditLog({
          userId: user.id,
          eventType: AuditEvent.DISCORD_LINKED,
          metadata: { discordUserId: String(account.providerAccountId) },
        });
      } catch (error) {
        console.error("[auth][discord] Failed to upsert Discord account.", error);
      }
    },
  },
  logger: {
    error(error) {
      const type =
        typeof error === "object" && error && "type" in error ? String((error as any).type) : "";
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? `${error.name}: ${error.message}`
            : typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : "";

      // These are expected in a database-session setup because we do credentials
      // sign-in via our custom /api/auth/credentials route (not NextAuth's
      // Credentials provider). Keep logs clean.
      if (type === "UnsupportedStrategy" || message.includes("UnsupportedStrategy")) {
        return;
      }

      if (type === "CredentialsSignin" || message.includes("CredentialsSignin")) {
        return;
      }
      console.error("[auth][error]", error);
    },
    warn(message) {
      console.warn("[auth][warn]", message);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: AUTH_SECRET,
});
