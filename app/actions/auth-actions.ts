"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export async function logoutAction() {
  const sessionUser = await getSessionUser();
  const requestHeaders = await headers();

  if (sessionUser) {
    await createAuditLog({
      userId: sessionUser.id,
      eventType: AuditEvent.LOGOUT,
      ip:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders.get("x-real-ip"),
      userAgent: requestHeaders.get("user-agent"),
    });
  }

  redirect("/api/auth/clear-session");
}
