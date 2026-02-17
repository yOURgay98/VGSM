import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { canGrantRole } from "@/lib/permissions";
import { assertCanEditRole } from "@/lib/security/authorize";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { DEFAULT_COMMUNITY_ID } from "@/lib/services/community";

export interface GeneralSettings {
  communityName: string;
  theme: "light" | "dark" | "gray";
  tempBanPresets: number[];
}

const GENERAL_SETTINGS_KEY = "general";

const defaultSettings: GeneralSettings = {
  communityName: "Vanguard Community",
  theme: "light",
  tempBanPresets: [30, 60, 180, 1440],
};

export async function getGeneralSettings(
  communityId = DEFAULT_COMMUNITY_ID,
): Promise<GeneralSettings> {
  const setting = await prisma.setting.findUnique({
    where: { communityId_key: { communityId, key: GENERAL_SETTINGS_KEY } },
  });

  if (!setting) {
    return defaultSettings;
  }

  const parsed = setting.valueJson as Partial<GeneralSettings>;
  const theme = parsed.theme === "dark" || parsed.theme === "gray" ? parsed.theme : "light";

  return {
    communityName: parsed.communityName ?? defaultSettings.communityName,
    theme,
    tempBanPresets:
      parsed.tempBanPresets?.length && Array.isArray(parsed.tempBanPresets)
        ? parsed.tempBanPresets
        : defaultSettings.tempBanPresets,
  };
}

export async function updateGeneralSettings(input: {
  actorUserId: string;
  communityId: string;
  payload: GeneralSettings;
}) {
  const result = await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key: GENERAL_SETTINGS_KEY } },
    create: {
      communityId: input.communityId,
      key: GENERAL_SETTINGS_KEY,
      valueJson: input.payload as unknown as Prisma.InputJsonValue,
    },
    update: { valueJson: input.payload as unknown as Prisma.InputJsonValue },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.SETTINGS_UPDATED,
    metadata: input.payload as unknown as Prisma.InputJsonValue,
  });

  return result;
}

export async function listUsersForRoleManagement() {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabledAt: true,
      createdAt: true,
    },
  });
}

export async function assignRoleToUser(input: {
  actorUserId: string;
  actorRole: Role;
  targetUserId: string;
  role: Role;
}) {
  if (!canGrantRole(input.actorRole, input.role)) {
    throw new Error("You cannot grant this role.");
  }

  const target = await prisma.user.findUnique({ where: { id: input.targetUserId } });

  if (!target) {
    throw new Error("Target user not found.");
  }

  assertCanEditRole({
    actorRole: input.actorRole,
    targetRole: target.role,
    newRole: input.role,
  });

  const user = await prisma.user.update({
    where: { id: input.targetUserId },
    data: { role: input.role },
  });

  await createAuditLog({
    userId: input.actorUserId,
    eventType: AuditEvent.ROLE_UPDATED,
    metadata: {
      targetUserId: input.targetUserId,
      previousRole: target.role,
      newRole: input.role,
    },
  });

  return user;
}
