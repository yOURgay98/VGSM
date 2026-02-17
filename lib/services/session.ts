import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/db";

const SESSION_TOUCH_THROTTLE_MS = 60_000;
const lastSessionTouchAtByToken = new Map<string, number>();
const lastSessionPathByToken = new Map<string, string>();

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

export async function getCurrentSessionToken() {
  const store = await cookies();
  for (const name of SESSION_COOKIE_NAMES) {
    const value = store.get(name)?.value;
    if (value) return value;
  }
  return null;
}

export async function touchCurrentSession(userId: string) {
  return touchCurrentSessionWithPath(userId, null);
}

export async function touchCurrentSessionWithPath(userId: string, currentPath: string | null) {
  const token = await getCurrentSessionToken();
  if (!token) return;

  const now = Date.now();
  const lastTouchedAt = lastSessionTouchAtByToken.get(token);
  const nextPath = currentPath?.trim() ? currentPath.trim().slice(0, 180) : null;
  const lastPath = lastSessionPathByToken.get(token);
  const pathChanged = Boolean(nextPath && nextPath !== lastPath);

  // Allow faster updates when the user navigates to a new location (presence panel).
  if (!pathChanged && lastTouchedAt && now - lastTouchedAt < SESSION_TOUCH_THROTTLE_MS) {
    return;
  }

  lastSessionTouchAtByToken.set(token, now);
  if (nextPath) lastSessionPathByToken.set(token, nextPath);

  if (lastSessionTouchAtByToken.size > 5_000) {
    // Avoid unbounded growth in long-lived dev sessions.
    lastSessionTouchAtByToken.clear();
    lastSessionPathByToken.clear();
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;

  await prisma.session.updateMany({
    where: { sessionToken: token, userId },
    data: {
      lastActiveAt: new Date(),
      ip,
      userAgent,
      ...(nextPath ? { currentPath: nextPath } : {}),
    },
  });
}

export async function listUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
  });
}

export async function revokeSession(sessionToken: string, userId: string) {
  await prisma.session.deleteMany({
    where: { sessionToken, userId },
  });
}

export async function revokeOtherSessions(userId: string, keepSessionToken: string) {
  await prisma.session.deleteMany({
    where: { userId, sessionToken: { not: keepSessionToken } },
  });
}
