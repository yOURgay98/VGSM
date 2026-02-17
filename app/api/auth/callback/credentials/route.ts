import { NextResponse } from "next/server";

import { absoluteUrl } from "@/lib/http/request-url";

export async function GET(request: Request) {
  // Credentials callback is intentionally disabled because this app uses a
  // database-session credentials flow at /api/auth/credentials.
  return NextResponse.redirect(absoluteUrl(request, "/login"), { status: 302 });
}

export async function POST() {
  // Returning a stable JSON error prevents Auth.js from throwing
  // UnsupportedStrategy spam in server logs.
  return NextResponse.json({ ok: false, code: "use_custom_login" as const }, { status: 400 });
}
