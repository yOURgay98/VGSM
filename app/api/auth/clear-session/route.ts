import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getCurrentSessionToken } from "@/lib/services/session";
import { absoluteUrl } from "@/lib/http/request-url";

const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

function getRequestMeta(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function GET(req: Request) {
  const token = await getCurrentSessionToken();
  const { ip, userAgent } = getRequestMeta(req);

  if (token) {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken: token },
        select: { userId: true, activeCommunityId: true },
      });

      await prisma.session.deleteMany({ where: { sessionToken: token } });

      if (session?.userId) {
        await createAuditLog({
          userId: session.userId,
          communityId: session.activeCommunityId ?? null,
          eventType: AuditEvent.LOGOUT,
          ip,
          userAgent,
          metadata: { source: "clear_session" } as any,
        });

        await createAuditLog({
          userId: session.userId,
          communityId: session.activeCommunityId ?? null,
          eventType: AuditEvent.SESSION_REVOKED,
          ip,
          userAgent,
          metadata: { source: "clear_session" } as any,
        });
      }
    } catch {
      // Best-effort only.
    }
  }

  const res = NextResponse.redirect(absoluteUrl(req, "/"), { status: 303 });
  for (const name of SESSION_COOKIE_NAMES) {
    res.cookies.set(name, "", { path: "/", expires: new Date(0) });
  }
  return res;
}
