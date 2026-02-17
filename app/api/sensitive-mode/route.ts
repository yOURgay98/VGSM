import { NextResponse } from "next/server";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getSessionUser } from "@/lib/services/auth";
import { getCurrentSessionToken } from "@/lib/services/session";
import { getSensitiveModeStatus } from "@/lib/services/sensitive-mode";

export async function GET() {
  if (isAuthBypassEnabled()) {
    return NextResponse.json({ enabled: false, expiresAt: null, bypass: true });
  }

  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getCurrentSessionToken();
  if (!token) {
    return NextResponse.json({ enabled: false, expiresAt: null });
  }

  const status = await getSensitiveModeStatus({ userId, sessionToken: token });
  return NextResponse.json({
    enabled: status.enabled,
    expiresAt: status.expiresAt ? status.expiresAt.toISOString() : null,
  });
}
