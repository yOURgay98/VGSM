import { prisma } from "@/lib/db";

export async function getSensitiveModeStatus(input: { userId: string; sessionToken: string }) {
  const now = new Date();
  const grant = await prisma.sensitiveModeGrant.findUnique({
    where: { sessionToken: input.sessionToken },
    select: { userId: true, expiresAt: true },
  });

  if (!grant) {
    return { enabled: false, expiresAt: null as Date | null };
  }

  if (grant.userId !== input.userId || grant.expiresAt <= now) {
    // Cleanup stale grants opportunistically.
    await prisma.sensitiveModeGrant.deleteMany({
      where: { sessionToken: input.sessionToken },
    });
    return { enabled: false, expiresAt: null as Date | null };
  }

  return { enabled: true, expiresAt: grant.expiresAt };
}

export async function enableSensitiveMode(input: {
  userId: string;
  sessionToken: string;
  ttlMinutes: number;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.ttlMinutes * 60_000);

  const grant = await prisma.sensitiveModeGrant.upsert({
    where: { sessionToken: input.sessionToken },
    create: {
      sessionToken: input.sessionToken,
      userId: input.userId,
      enabledAt: now,
      expiresAt,
    },
    update: {
      userId: input.userId,
      enabledAt: now,
      expiresAt,
    },
    select: { expiresAt: true },
  });

  return grant;
}

export async function disableSensitiveMode(input: { userId: string; sessionToken: string }) {
  await prisma.sensitiveModeGrant.deleteMany({
    where: { sessionToken: input.sessionToken, userId: input.userId },
  });
}
