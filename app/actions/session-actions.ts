"use server";

import { revalidatePath } from "next/cache";

import { requireSessionUser } from "@/lib/services/auth";
import { getCurrentSessionToken, revokeOtherSessions, revokeSession } from "@/lib/services/session";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export interface SessionActionResult {
  success: boolean;
  message: string;
}

export async function revokeSessionTokenAction(sessionToken: string): Promise<SessionActionResult> {
  const user = await requireSessionUser();

  if (!sessionToken) {
    return { success: false, message: "Missing session token." };
  }

  await revokeSession(sessionToken, user.id);

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.SESSION_REVOKED,
    metadata: { sessionToken: sessionToken.slice(0, 10) + "..." },
  });

  revalidatePath("/app/profile");
  return { success: true, message: "Session revoked." };
}

export async function revokeSessionAction(
  _prev: SessionActionResult,
  formData: FormData,
): Promise<SessionActionResult> {
  const token = String(formData.get("sessionToken") ?? "");
  return revokeSessionTokenAction(token);
}

export async function revokeOtherSessionsAction(): Promise<SessionActionResult> {
  const user = await requireSessionUser();
  const current = await getCurrentSessionToken();
  if (!current) {
    return { success: false, message: "Unable to determine current session." };
  }

  await revokeOtherSessions(user.id, current);

  await createAuditLog({
    userId: user.id,
    eventType: AuditEvent.SESSION_REVOKE_OTHERS,
  });

  revalidatePath("/app/profile");
  return { success: true, message: "Other sessions revoked." };
}
