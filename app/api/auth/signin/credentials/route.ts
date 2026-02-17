import { NextResponse } from "next/server";

import { absoluteUrl } from "@/lib/http/request-url";

export async function GET(request: Request) {
  // Credentials sign-in is handled by /api/auth/credentials, not Auth.js.
  return NextResponse.redirect(absoluteUrl(request, "/login"), { status: 302 });
}

export async function POST() {
  return NextResponse.json({ ok: false, code: "use_custom_login" as const }, { status: 400 });
}
