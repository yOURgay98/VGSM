import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasRoleAtLeast } from "@/lib/permissions";
import { authorize } from "@/lib/security/authorize";
import type { Permission } from "@/lib/security/permissions";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getCommunityAuthContext, requireActiveCommunityId } from "@/lib/services/community";
import { getCurrentSessionToken } from "@/lib/services/session";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthorizedUser extends AuthenticatedUser {
  communityId: string;
  community: { id: string; name: string; slug: string };
  membership: {
    id: string;
    role: { id: string; name: string; priority: number; isSystemDefault: boolean };
  };
  permissions: readonly Permission[];
}

async function isPageRenderRequest() {
  try {
    const h = await headers();
    if (h.get("next-action")) {
      return false;
    }
    const accept = h.get("accept") ?? "";
    return accept.includes("text/html") || accept.includes("text/x-component");
  } catch {
    return false;
  }
}

function getBypassRole(): Role {
  const role = process.env.AUTH_BYPASS_ROLE;
  if (!role) {
    return Role.OWNER;
  }
  return Object.values(Role).includes(role as Role) ? (role as Role) : Role.OWNER;
}

function getBypassUser(): AuthenticatedUser {
  return {
    id: process.env.AUTH_BYPASS_ID ?? "bypass-owner",
    email: process.env.AUTH_BYPASS_EMAIL ?? "owner@example.com",
    name: process.env.AUTH_BYPASS_NAME ?? "Bypass Owner",
    role: getBypassRole(),
  };
}

let cachedBypassUser: AuthenticatedUser | null = null;
let bypassCacheValidUntil = 0;
let bypassDatabaseUnavailableUntil = 0;
let lastBypassDatabaseErrorLoggedAt = 0;

async function resolveBypassUser(): Promise<AuthenticatedUser> {
  const now = Date.now();

  if (cachedBypassUser && now < bypassCacheValidUntil) {
    return cachedBypassUser;
  }

  // Re-resolve occasionally so changes in the seeded owner account / env vars apply.
  bypassCacheValidUntil = now + 30_000;

  const fallback = getBypassUser();

  if (now < bypassDatabaseUnavailableUntil) {
    cachedBypassUser = fallback;
    return fallback;
  }

  // In bypass mode we still want a real DB user id so writes that reference userId
  // don't spam errors / violate foreign keys.
  try {
    const user = await prisma.user.findUnique({
      where: { email: fallback.email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user) {
      const overrideRole = process.env.AUTH_BYPASS_ROLE ? getBypassRole() : user.role;
      cachedBypassUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: overrideRole,
      };
      return cachedBypassUser;
    }
  } catch (error) {
    bypassDatabaseUnavailableUntil = now + 10_000;
    if (now - lastBypassDatabaseErrorLoggedAt > 10_000) {
      lastBypassDatabaseErrorLoggedAt = now;
      console.error("[auth] Bypass user lookup failed, falling back to env user.", error);
    }
  }

  cachedBypassUser = fallback;
  return fallback;
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  if (isAuthBypassEnabled()) {
    return resolveBypassUser();
  }

  const sessionToken = await getCurrentSessionToken();
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      userId: true,
      expires: true,
      user: {
        select: {
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!session || session.expires <= new Date()) {
    return null;
  }

  return {
    id: session.userId,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    if (await isPageRenderRequest()) {
      const sessionToken = await getCurrentSessionToken();
      if (sessionToken) {
        redirect("/api/auth/clear-session");
      }
      redirect("/login");
    }
    throw new Error("Authentication required.");
  }

  return user;
}

export async function requireMinimumRole(role: Role) {
  const user = await requireSessionUser();

  if (!hasRoleAtLeast(user.role, role)) {
    throw new Error("Insufficient permissions.");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireSessionUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { disabledAt: true },
  });

  if (!dbUser) {
    throw new Error("User record missing.");
  }

  const communityId = await requireActiveCommunityId(user.id);
  const ctx = await getCommunityAuthContext({ userId: user.id, communityId });

  authorize(
    { id: user.id, role: user.role, disabledAt: dbUser.disabledAt, permissions: ctx.permissions },
    permission,
  );

  return {
    ...user,
    communityId,
    community: ctx.community,
    membership: ctx.membership,
    permissions: ctx.permissions,
  } satisfies AuthorizedUser;
}
