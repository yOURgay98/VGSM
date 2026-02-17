import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { DEFAULT_COMMUNITY_ID } from "@/lib/services/community";
import type { MapSettings } from "@/lib/validations/map";

const MAP_SETTINGS_KEY = "map";

const defaultSettings: MapSettings = {
  styleUrl: "/map/style.json",
};

function normalizeStyleUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  if (!url || url.length > 500) return null;

  // Safe defaults: local relative styles (preferred) + HTTPS remote styles.
  // Permit HTTP only in dev so local LAN style servers can be used.
  if (url.startsWith("/")) return url;
  if (url.startsWith("https://")) return url;
  if (process.env.NODE_ENV !== "production" && url.startsWith("http://")) return url;

  return null;
}

export async function getMapSettings(communityId = DEFAULT_COMMUNITY_ID): Promise<MapSettings> {
  const setting = await prisma.setting.findUnique({
    where: { communityId_key: { communityId, key: MAP_SETTINGS_KEY } },
    select: { valueJson: true },
  });

  if (!setting) return defaultSettings;

  const parsed = (setting.valueJson ?? {}) as Partial<MapSettings>;
  const styleUrl = normalizeStyleUrl(parsed.styleUrl) ?? defaultSettings.styleUrl;

  return { styleUrl };
}

export async function updateMapSettings(input: {
  actorUserId: string;
  communityId: string;
  payload: MapSettings;
}) {
  const styleUrl = normalizeStyleUrl(input.payload.styleUrl) ?? defaultSettings.styleUrl;
  const payload: MapSettings = { styleUrl };

  const result = await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key: MAP_SETTINGS_KEY } },
    create: {
      communityId: input.communityId,
      key: MAP_SETTINGS_KEY,
      valueJson: payload as unknown as Prisma.InputJsonValue,
    },
    update: { valueJson: payload as unknown as Prisma.InputJsonValue },
    select: { id: true },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.SETTINGS_UPDATED,
    metadata: { key: MAP_SETTINGS_KEY, ...payload } as unknown as Prisma.InputJsonValue,
  });

  return result;
}
