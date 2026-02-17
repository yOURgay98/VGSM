import { NextResponse } from "next/server";

import { safeInternalRedirect } from "@/lib/auth/safe-redirect";
import { absoluteUrl } from "@/lib/http/request-url";

export async function GET(request: Request) {
  // We use a custom login flow at /login which talks to /api/auth/credentials.
  // Redirect away from Auth.js default sign-in endpoints to avoid confusion.
  const reqUrl = new URL(request.url);
  const callbackUrl = reqUrl.searchParams.get("callbackUrl");

  const params = new URLSearchParams();
  if (callbackUrl) {
    params.set("callbackUrl", safeInternalRedirect(callbackUrl, "/app/dashboard"));
  }

  const location = params.toString() ? `/login?${params.toString()}` : "/login";
  return NextResponse.redirect(absoluteUrl(request, location), { status: 302 });
}
