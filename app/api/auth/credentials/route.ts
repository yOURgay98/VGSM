import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { safeInternalRedirect } from "@/lib/auth/safe-redirect";
import { absoluteUrl } from "@/lib/http/request-url";
import { loginSchema } from "@/lib/validations/auth";
import { verifyCredentialsLogin } from "@/lib/services/credentials-login";

const SESSION_MAX_AGE_DAYS = 30;

type LoginBody = {
  email?: unknown;
  password?: unknown;
  twoFactorCode?: unknown;
  callbackUrl?: unknown;
};

function sessionCookieName() {
  // Keep aligned with Auth.js defaults.
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

function getRequestMeta(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}

async function createSession(input: {
  userId: string;
  ip: string | null;
  userAgent: string | null;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Prefill active community to avoid extra writes on first load.
  const membership = await prisma.communityMembership.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "asc" },
    select: { communityId: true },
  });

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: input.userId,
      expires,
      ip: input.ip,
      userAgent: input.userAgent,
      activeCommunityId: membership?.communityId ?? null,
    },
  });

  return { token, expires };
}

function redirectToLogin(request: Request, input: { error: string; callbackUrl?: string | null }) {
  const params = new URLSearchParams();
  params.set("error", input.error);
  if (input.callbackUrl) {
    params.set("callbackUrl", input.callbackUrl);
  }
  const location = `/login?${params.toString()}`;
  return NextResponse.redirect(absoluteUrl(request, location), { status: 303 });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let body: LoginBody = {};
  if (isJson) {
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      body = {};
    }
  } else {
    try {
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await request.text();
        const params = new URLSearchParams(text);
        body = {
          email: params.get("email") ?? undefined,
          password: params.get("password") ?? undefined,
          twoFactorCode: params.get("twoFactorCode") ?? undefined,
          callbackUrl: params.get("callbackUrl") ?? undefined,
        };
      } else {
        const form = await request.formData();
        body = {
          email: form.get("email") ?? undefined,
          password: form.get("password") ?? undefined,
          twoFactorCode: form.get("twoFactorCode") ?? undefined,
          callbackUrl: form.get("callbackUrl") ?? undefined,
        };
      }
    } catch {
      body = {};
    }
  }

  const parsed = loginSchema.safeParse({
    email: body?.email,
    password: body?.password,
    twoFactorCode: body?.twoFactorCode,
  });

  if (!parsed.success) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, code: "invalid_credentials" as const },
        { status: 400 },
      );
    }

    const callbackUrl = safeInternalRedirect(body?.callbackUrl, "/app/dashboard");
    return redirectToLogin(request, { error: "invalid_credentials", callbackUrl });
  }

  const { ip, userAgent } = getRequestMeta(request);

  try {
    const user = await verifyCredentialsLogin({
      email: parsed.data.email,
      password: parsed.data.password,
      twoFactorCode: parsed.data.twoFactorCode,
      ip,
      userAgent,
    });

    const { token, expires } = await createSession({ userId: user.id, ip, userAgent });

    const redirectUrl = safeInternalRedirect(body?.callbackUrl, "/app/dashboard");

    const res = isJson
      ? NextResponse.json({ ok: true, redirectUrl } as const)
      : NextResponse.redirect(absoluteUrl(request, redirectUrl), { status: 303 });

    res.cookies.set({
      name: sessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    });

    return res;
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as any).code)
        : "invalid_credentials";

    const statusByCode: Record<string, number> = {
      invalid_credentials: 401,
      rate_limited: 429,
      locked: 423,
      disabled: 403,
      "2fa_required": 401,
      "2fa_invalid": 401,
      service_unavailable: 503,
    };
    const status = statusByCode[code] ?? 401;

    if (isJson) {
      return NextResponse.json({ ok: false, code } as const, { status });
    }

    const callbackUrl = safeInternalRedirect(body?.callbackUrl, "/app/dashboard");
    return redirectToLogin(request, { error: code, callbackUrl });
  }
}
