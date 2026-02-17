import { NextResponse } from "next/server";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getSessionUser } from "@/lib/services/auth";
import { touchCurrentSessionWithPath } from "@/lib/services/session";

export async function POST(request: Request) {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ ok: true, bypass: true });
  }

  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let currentPath: string | null = null;
  try {
    const body = (await request.json()) as { path?: unknown };
    const raw = typeof body?.path === "string" ? body.path.trim() : "";
    // Only record in-app navigation paths.
    if (raw.startsWith("/app") || raw.startsWith("/overlay")) {
      currentPath = raw.slice(0, 180);
    }
  } catch {
    // Ignore malformed payloads.
  }

  await touchCurrentSessionWithPath(userId, currentPath);

  return NextResponse.json({ ok: true });
}
