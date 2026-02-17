import { NextResponse, type NextRequest } from "next/server";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";

function isPublicNoAuthPath(pathname: string) {
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/features" ||
    pathname === "/download" ||
    pathname === "/docs" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    return true;
  }

  // /api/auth is public for normal auth flows, but we restrict Discord OAuth to account-linking
  // only (requires an existing session cookie).
  if (pathname.startsWith("/api/auth/signin/discord")) return false;
  if (pathname.startsWith("/api/auth/callback/discord")) return false;
  return pathname.startsWith("/invite/") || pathname.startsWith("/api/auth");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  if (isPublicNoAuthPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthBypassEnabled()) {
    if (pathname === "/login" || pathname === "/auth/sign-in") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // NextAuth "database" sessions use an opaque session token cookie (not a JWT).
  // Edge middleware cannot query Prisma, so we treat the presence of a session cookie
  // as "likely authenticated" and let server-side layouts do the definitive check.
  const sessionCookie =
    request.cookies.get("__Secure-authjs.session-token")?.value ??
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-next-auth.session-token")?.value ??
    request.cookies.get("next-auth.session-token")?.value ??
    null;

  const hasAuth = Boolean(sessionCookie);

  // Default security posture: do not allow Discord OAuth to be used as an authentication method.
  // Only allow it for linking (an already-authenticated user will have a session cookie).
  if (
    (pathname.startsWith("/api/auth/signin/discord") ||
      pathname.startsWith("/api/auth/callback/discord")) &&
    !hasAuth
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/app") && !hasAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Do not redirect away from /login based on cookie presence alone.
  // With database sessions a stale cookie can exist after session deletion,
  // and forcing redirect here can create a login loop.
  // The /login page itself performs the definitive authenticated redirect.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
