import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { logTenantViolationIfExists } from "@/lib/services/tenant";
import type { MapLayerState, MapViewStateUpdate } from "@/lib/validations/map";

function toLayerState(val: unknown): MapLayerState {
  const raw = (val && typeof val === "object" ? (val as any) : {}) as Partial<MapLayerState>;
  return {
    calls: raw.calls !== false,
    units: raw.units !== false,
    pois: raw.pois !== false,
    zones: raw.zones !== false,
    heatmap: raw.heatmap === true,
    labels: raw.labels !== false,
    postalGrid: raw.postalGrid === true,
  };
}

export async function listMapPois(input: {
  communityId: string;
  category?: string | null;
  take?: number;
  cursor?: string | null;
}) {
  const take = Math.min(Math.max(input.take ?? 200, 1), 500);
  const category = input.category?.trim() ? input.category.trim().slice(0, 32) : null;

  const items = await prisma.mapPOI.findMany({
    where: {
      communityId: input.communityId,
      isHidden: false,
      ...(category ? { category } : {}),
    },
    take,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      lat: true,
      lng: true,
      mapX: true,
      mapY: true,
      icon: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const nextCursor = items.length === take ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

export async function createMapPoi(input: {
  communityId: string;
  actorUserId: string;
  name: string;
  description?: string | null;
  category: string;
  lat?: number | null;
  lng?: number | null;
  mapX?: number | null;
  mapY?: number | null;
  icon?: string | null;
  color?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const poi = await prisma.mapPOI.create({
    data: {
      communityId: input.communityId,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      lat: typeof input.lat === "number" ? input.lat : null,
      lng: typeof input.lng === "number" ? input.lng : null,
      mapX: typeof input.mapX === "number" ? input.mapX : null,
      mapY: typeof input.mapY === "number" ? input.mapY : null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      createdById: input.actorUserId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      lat: true,
      lng: true,
      mapX: true,
      mapY: true,
      icon: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_POI_CREATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      poiId: poi.id,
      name: poi.name,
      category: poi.category,
    } as unknown as Prisma.InputJsonValue,
  });

  return poi;
}

export async function updateMapPoi(input: {
  communityId: string;
  actorUserId: string;
  poiId: string;
  patch: Partial<{
    name: string;
    description: string | null;
    category: string;
    lat: number | null;
    lng: number | null;
    mapX: number | null;
    mapY: number | null;
    icon: string | null;
    color: string | null;
    isHidden: boolean;
  }>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.mapPOI.updateMany({
    where: { id: input.poiId, communityId: input.communityId },
    data: {
      ...(typeof input.patch.name === "string" ? { name: input.patch.name } : {}),
      ...(input.patch.description !== undefined ? { description: input.patch.description } : {}),
      ...(typeof input.patch.category === "string" ? { category: input.patch.category } : {}),
      ...(input.patch.lat !== undefined ? { lat: input.patch.lat } : {}),
      ...(input.patch.lng !== undefined ? { lng: input.patch.lng } : {}),
      ...(input.patch.mapX !== undefined ? { mapX: input.patch.mapX } : {}),
      ...(input.patch.mapY !== undefined ? { mapY: input.patch.mapY } : {}),
      ...(input.patch.icon !== undefined ? { icon: input.patch.icon } : {}),
      ...(input.patch.color !== undefined ? { color: input.patch.color } : {}),
      ...(typeof input.patch.isHidden === "boolean" ? { isHidden: input.patch.isHidden } : {}),
    },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "map_poi",
      resourceId: input.poiId,
      operation: "write",
    });
    throw new Error("POI not found.");
  }

  const poi = await prisma.mapPOI.findFirst({
    where: { id: input.poiId, communityId: input.communityId },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      lat: true,
      lng: true,
      mapX: true,
      mapY: true,
      icon: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_POI_UPDATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { poiId: input.poiId, patch: input.patch } as unknown as Prisma.InputJsonValue,
  });

  return poi;
}

export async function hideMapPoi(input: {
  communityId: string;
  actorUserId: string;
  poiId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.mapPOI.updateMany({
    where: { id: input.poiId, communityId: input.communityId },
    data: { isHidden: true },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "map_poi",
      resourceId: input.poiId,
      operation: "delete",
    });
    throw new Error("POI not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_POI_DELETED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { poiId: input.poiId } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true as const };
}

export async function listMapZones(input: {
  communityId: string;
  zoneType?: string | null;
  take?: number;
  cursor?: string | null;
}) {
  const take = Math.min(Math.max(input.take ?? 200, 1), 500);
  const zoneType = input.zoneType?.trim() ? input.zoneType.trim().slice(0, 24) : null;

  const items = await prisma.mapZone.findMany({
    where: {
      communityId: input.communityId,
      isHidden: false,
      ...(zoneType ? { zoneType } : {}),
    },
    take,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    orderBy: { id: "desc" },
    select: {
      id: true,
      name: true,
      zoneType: true,
      geojson: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const nextCursor = items.length === take ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

export async function createMapZone(input: {
  communityId: string;
  actorUserId: string;
  name: string;
  zoneType: string;
  geojson: unknown;
  color?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const zone = await prisma.mapZone.create({
    data: {
      communityId: input.communityId,
      name: input.name,
      zoneType: input.zoneType,
      geojson: input.geojson as Prisma.InputJsonValue,
      color: input.color ?? null,
      createdById: input.actorUserId,
    },
    select: {
      id: true,
      name: true,
      zoneType: true,
      geojson: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_ZONE_CREATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: {
      zoneId: zone.id,
      name: zone.name,
      zoneType: zone.zoneType,
    } as unknown as Prisma.InputJsonValue,
  });

  return zone;
}

export async function updateMapZone(input: {
  communityId: string;
  actorUserId: string;
  zoneId: string;
  patch: Partial<{
    name: string;
    zoneType: string;
    geojson: unknown;
    color: string | null;
    isHidden: boolean;
  }>;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.mapZone.updateMany({
    where: { id: input.zoneId, communityId: input.communityId },
    data: {
      ...(typeof input.patch.name === "string" ? { name: input.patch.name } : {}),
      ...(typeof input.patch.zoneType === "string" ? { zoneType: input.patch.zoneType } : {}),
      ...(input.patch.geojson !== undefined
        ? { geojson: input.patch.geojson as Prisma.InputJsonValue }
        : {}),
      ...(input.patch.color !== undefined ? { color: input.patch.color } : {}),
      ...(typeof input.patch.isHidden === "boolean" ? { isHidden: input.patch.isHidden } : {}),
    },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "map_zone",
      resourceId: input.zoneId,
      operation: "write",
    });
    throw new Error("Zone not found.");
  }

  const zone = await prisma.mapZone.findFirst({
    where: { id: input.zoneId, communityId: input.communityId },
    select: {
      id: true,
      name: true,
      zoneType: true,
      geojson: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_ZONE_UPDATED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { zoneId: input.zoneId, patch: input.patch } as unknown as Prisma.InputJsonValue,
  });

  return zone;
}

export async function hideMapZone(input: {
  communityId: string;
  actorUserId: string;
  zoneId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.mapZone.updateMany({
    where: { id: input.zoneId, communityId: input.communityId },
    data: { isHidden: true },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "map_zone",
      resourceId: input.zoneId,
      operation: "delete",
    });
    throw new Error("Zone not found.");
  }

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: AuditEvent.MAP_ZONE_DELETED,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { zoneId: input.zoneId } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true as const };
}

export async function getMapViewState(input: {
  communityId: string;
  userId: string;
  scope: string;
}) {
  const state = await prisma.mapViewState.findUnique({
    where: {
      communityId_userId_scope: {
        communityId: input.communityId,
        userId: input.userId,
        scope: input.scope,
      },
    },
    select: {
      id: true,
      scope: true,
      centerLat: true,
      centerLng: true,
      zoom: true,
      enabledLayers: true,
      updatedAt: true,
    },
  });

  if (!state) {
    return null;
  }

  return {
    id: state.id,
    scope: state.scope,
    centerLat: state.centerLat,
    centerLng: state.centerLng,
    zoom: state.zoom,
    enabledLayers: toLayerState(state.enabledLayers),
    updatedAt: state.updatedAt,
  };
}

export async function saveMapViewState(input: {
  communityId: string;
  userId: string;
  scope: string;
  patch: MapViewStateUpdate;
}) {
  const enabledLayers = toLayerState(input.patch.enabledLayers);

  const state = await prisma.mapViewState.upsert({
    where: {
      communityId_userId_scope: {
        communityId: input.communityId,
        userId: input.userId,
        scope: input.scope,
      },
    },
    create: {
      communityId: input.communityId,
      userId: input.userId,
      scope: input.scope,
      centerLat: input.patch.centerLat,
      centerLng: input.patch.centerLng,
      zoom: input.patch.zoom,
      enabledLayers: enabledLayers as unknown as Prisma.InputJsonValue,
    },
    update: {
      centerLat: input.patch.centerLat,
      centerLng: input.patch.centerLng,
      zoom: input.patch.zoom,
      enabledLayers: enabledLayers as unknown as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      scope: true,
      centerLat: true,
      centerLng: true,
      zoom: true,
      enabledLayers: true,
      updatedAt: true,
    },
  });

  return {
    id: state.id,
    scope: state.scope,
    centerLat: state.centerLat,
    centerLng: state.centerLng,
    zoom: state.zoom,
    enabledLayers: toLayerState(state.enabledLayers),
    updatedAt: state.updatedAt,
  };
}
