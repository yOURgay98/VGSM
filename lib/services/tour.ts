import { prisma } from "@/lib/db";

const TOUR_KEY_PREFIX = "tour.welcome.completed.";

function completionKey(userId: string) {
  return `${TOUR_KEY_PREFIX}${userId}`;
}

export async function getWelcomeTourCompletion(input: { communityId: string; userId: string }) {
  const key = completionKey(input.userId);
  const setting = await prisma.setting.findUnique({
    where: { communityId_key: { communityId: input.communityId, key } },
    select: { valueJson: true },
  });
  const raw = (setting?.valueJson ?? {}) as { completed?: boolean; completedAt?: string };
  return {
    completed: raw.completed === true,
    completedAt: typeof raw.completedAt === "string" ? raw.completedAt : null,
  };
}

export async function setWelcomeTourCompletion(input: {
  communityId: string;
  userId: string;
  completed: boolean;
}) {
  const key = completionKey(input.userId);
  const completedAt = input.completed ? new Date().toISOString() : null;

  await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key } },
    update: {
      valueJson: {
        completed: input.completed,
        completedAt,
      },
    },
    create: {
      communityId: input.communityId,
      key,
      valueJson: {
        completed: input.completed,
        completedAt,
      },
    },
  });
}
