import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export async function changeUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!valid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash, forceChangePassword: false },
  });

  await createAuditLog({
    userId: input.userId,
    eventType: AuditEvent.PASSWORD_CHANGED,
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      disabledAt: true,
      lockedUntil: true,
      twoFactorEnabled: true,
      forceChangePassword: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      disabledAt: true,
      lockedUntil: true,
      twoFactorEnabled: true,
      forceChangePassword: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}
