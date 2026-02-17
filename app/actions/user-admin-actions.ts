"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { assertCanDisableUser } from "@/lib/security/authorize";
import { Permission } from "@/lib/security/permissions";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { requirePermission } from "@/lib/services/auth";

function getRequestMeta(h: Headers) {
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function setUserDisabledAction(targetUserId: string, disabled: boolean) {
  const actor = await requirePermission(Permission.USERS_DISABLE);
  if (actor.id === targetUserId) {
    throw new Error("You cannot disable your own account.");
  }

  const h = await headers();
  const { ip, userAgent } = getRequestMeta(h);

  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, disabledAt: true },
    });

    if (!target) {
      throw new Error("Target user not found.");
    }

    assertCanDisableUser({ actorRole: actor.role, targetRole: target.role });

    const disabledAt = disabled ? new Date() : null;

    await tx.user.update({
      where: { id: targetUserId },
      data: { disabledAt },
    });

    if (disabled) {
      await tx.session.deleteMany({ where: { userId: targetUserId } });
    }

    await createAuditLog(
      {
        userId: actor.id,
        eventType: disabled ? AuditEvent.USER_DISABLED : AuditEvent.USER_ENABLED,
        ip,
        userAgent,
        metadata: {
          targetUserId,
          disabled,
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );
  });

  revalidatePath("/app/settings");
  revalidatePath("/login");
}
