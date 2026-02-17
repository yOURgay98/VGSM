import { Prisma, SavedViewScope } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export async function listSavedViews(input: {
  communityId: string;
  userId: string;
  scope: SavedViewScope;
}) {
  return prisma.savedView.findMany({
    where: { communityId: input.communityId, userId: input.userId, scope: input.scope },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      scope: true,
      filtersJson: true,
      updatedAt: true,
    },
  });
}

export async function saveView(input: {
  communityId: string;
  userId: string;
  scope: SavedViewScope;
  name: string;
  filters: Record<string, string>;
}) {
  const view = await prisma.savedView.upsert({
    where: {
      communityId_userId_scope_name: {
        communityId: input.communityId,
        userId: input.userId,
        scope: input.scope,
        name: input.name,
      },
    },
    create: {
      communityId: input.communityId,
      userId: input.userId,
      scope: input.scope,
      name: input.name,
      filtersJson: input.filters as unknown as Prisma.InputJsonValue,
    },
    update: {
      filtersJson: input.filters as unknown as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: input.userId,
    communityId: input.communityId,
    eventType: AuditEvent.VIEW_SAVED,
    metadata: { scope: input.scope, name: input.name } as unknown as Prisma.InputJsonValue,
  });

  return view;
}

export async function deleteView(input: { communityId: string; userId: string; viewId: string }) {
  const view = await prisma.savedView.findFirst({
    where: { id: input.viewId, communityId: input.communityId, userId: input.userId },
    select: { id: true, scope: true, name: true },
  });
  if (!view) return { ok: true } as const;

  await prisma.savedView.delete({ where: { id: view.id } });

  await createAuditLog({
    userId: input.userId,
    communityId: input.communityId,
    eventType: AuditEvent.VIEW_DELETED,
    metadata: { scope: view.scope, name: view.name } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true } as const;
}
