import { DispatchCallStatus, DispatchUnitStatus, DispatchUnitType, Prisma } from "@prisma/client";

import { clampTake, toCursorPage } from "@/lib/db/pagination";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

const CALL_TRANSITIONS: Record<DispatchCallStatus, readonly DispatchCallStatus[]> = {
  OPEN: [DispatchCallStatus.ASSIGNED, DispatchCallStatus.CANCELLED],
  ASSIGNED: [DispatchCallStatus.ENROUTE, DispatchCallStatus.CANCELLED],
  ENROUTE: [DispatchCallStatus.ON_SCENE, DispatchCallStatus.CANCELLED],
  ON_SCENE: [DispatchCallStatus.CLEARED, DispatchCallStatus.CANCELLED],
  CLEARED: [],
  CANCELLED: [],
};

export function checkDispatchCallTransition(input: {
  current: DispatchCallStatus;
  next: DispatchCallStatus;
  supervisor: boolean;
}): { ok: true } | { ok: false; reason: "supervisor_only_cancel" | "invalid_transition" } {
  if (input.next === input.current) return { ok: true };

  // Non-supervisors cannot cancel calls that are already terminal (or otherwise disallowed).
  if (
    input.next === DispatchCallStatus.CANCELLED &&
    !input.supervisor &&
    !CALL_TRANSITIONS[input.current].includes(DispatchCallStatus.CANCELLED)
  ) {
    return { ok: false, reason: "supervisor_only_cancel" };
  }

  const allowed = CALL_TRANSITIONS[input.current].includes(input.next);
  if (!allowed) return { ok: false, reason: "invalid_transition" };

  return { ok: true };
}

export async function listDispatchCalls(input: {
  communityId: string;
  status?: DispatchCallStatus | null;
  q?: string | null;
  take?: number;
  cursor?: string | null;
}) {
  const take = clampTake(input.take, { defaultTake: 60, maxTake: 200 });
  const cursor = input.cursor?.trim() ? input.cursor.trim() : null;
  const q = input.q?.trim() ? input.q.trim().slice(0, 80) : null;
  const where: Prisma.DispatchCallWhereInput = {
    communityId: input.communityId,
    ...(input.status ? { status: input.status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { locationName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const args = {
    where,
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      locationName: true,
      lat: true,
      lng: true,
      mapX: true,
      mapY: true,
      createdAt: true,
      updatedAt: true,
    },
  } satisfies Prisma.DispatchCallFindManyArgs;

  const rows = await prisma.dispatchCall.findMany(args);

  return toCursorPage(rows, take);
}

export async function getDispatchCallById(input: { communityId: string; callId: string }) {
  return prisma.dispatchCall.findFirst({
    where: { id: input.callId, communityId: input.communityId },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
      assignments: {
        orderBy: { assignedAt: "desc" },
        include: { unit: { select: { id: true, callSign: true, type: true, status: true } } },
        take: 30,
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 60,
        include: { createdByUser: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createDispatchCall(input: {
  communityId: string;
  actorUserId: string;
  title: string;
  description: string;
  priority: number;
  locationName?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapX?: number | null;
  mapY?: number | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const title = input.title.trim();
  const description = (input.description ?? "").trim();
  const priority = Math.min(Math.max(Math.floor(input.priority), 1), 5);
  const locationName = input.locationName?.trim() ? input.locationName.trim() : null;

  const lat = typeof input.lat === "number" && Number.isFinite(input.lat) ? input.lat : null;
  const lng = typeof input.lng === "number" && Number.isFinite(input.lng) ? input.lng : null;
  const mapX = typeof input.mapX === "number" && Number.isFinite(input.mapX) ? input.mapX : null;
  const mapY = typeof input.mapY === "number" && Number.isFinite(input.mapY) ? input.mapY : null;

  if (title.length < 2 || title.length > 120) {
    throw new Error("Title must be 2-120 characters.");
  }
  if (description.length > 2000) {
    throw new Error("Description must be 0-2000 characters.");
  }

  // Location rules:
  // - If coordinates are provided, both lat/lng must be set.
  // - If coordinates are not provided, require a location name so the call isn't "nowhere".
  const hasLat = lat !== null;
  const hasLng = lng !== null;
  if (hasLat !== hasLng) {
    throw new Error("Latitude and longitude must be provided together.");
  }
  const hasCoords = hasLat && hasLng;
  const hasMapCoords = mapX !== null && mapY !== null;
  if ((mapX !== null) !== (mapY !== null)) {
    throw new Error("Map X and Map Y must be provided together.");
  }
  if (!hasCoords && !hasMapCoords && !locationName) {
    throw new Error("Location is required when coordinates are not provided.");
  }

  return prisma.$transaction(async (tx) => {
    const call = await tx.dispatchCall.create({
      data: {
        communityId: input.communityId,
        title,
        description,
        priority,
        status: DispatchCallStatus.OPEN,
        locationName,
        lat,
        lng,
        mapX,
        mapY,
        createdByUserId: input.actorUserId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.dispatchEvent.create({
      data: {
        communityId: input.communityId,
        callId: call.id,
        type: "call.created",
        message: `Call created: ${call.title}`,
        createdByUserId: input.actorUserId,
      },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: "dispatch.call.created",
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          callId: call.id,
          title: call.title,
          priority: call.priority,
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return call;
  });
}

export async function transitionDispatchCallStatus(input: {
  communityId: string;
  actorUserId: string;
  actorRolePriority: number;
  callId: string;
  nextStatus: DispatchCallStatus;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const call = await tx.dispatchCall.findFirst({
      where: { id: input.callId, communityId: input.communityId },
      select: { id: true, title: true, status: true },
    });

    if (!call) {
      await logTenantViolationIfExists({
        actorUserId: input.actorUserId,
        actorCommunityId: input.communityId,
        resource: "dispatch_call",
        resourceId: input.callId,
        operation: "write",
      });
      throw new Error("Call not found.");
    }

    const current = call.status;
    const next = input.nextStatus;

    if (next === current) {
      return { ok: true as const, status: current };
    }

    // Supervisor-only: cancelling calls outside the normal OPEN/ASSIGNED path.
    const supervisor = input.actorRolePriority >= ROLE_PRIORITY.ADMIN;
    const check = checkDispatchCallTransition({ current, next, supervisor });
    if (!check.ok) {
      if (check.reason === "supervisor_only_cancel") {
        throw new Error("Only a supervisor can cancel a call at this stage.");
      }
      throw new Error(`Invalid transition: ${current} -> ${next}`);
    }

    await tx.dispatchCall.update({
      where: { id: call.id },
      data: { status: next },
      select: { id: true },
    });

    await tx.dispatchEvent.create({
      data: {
        communityId: input.communityId,
        callId: call.id,
        type: "call.status_changed",
        message: `Status: ${current} -> ${next}`,
        createdByUserId: input.actorUserId,
      },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: "dispatch.call.status_changed",
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: { callId: call.id, from: current, to: next } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { ok: true as const, status: next };
  });
}

export async function listDispatchUnits(input: {
  communityId: string;
  take?: number;
  cursor?: string | null;
}) {
  const take = clampTake(input.take, { defaultTake: 120, maxTake: 200 });
  const cursor = input.cursor?.trim() ? input.cursor.trim() : null;
  const args = {
    where: { communityId: input.communityId },
    orderBy: [{ status: "asc" }, { callSign: "asc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      callSign: true,
      type: true,
      status: true,
      assignedCallId: true,
      lastLat: true,
      lastLng: true,
      assignedCall: { select: { id: true, title: true, status: true, priority: true } },
      updatedAt: true,
    },
  } satisfies Prisma.DispatchUnitFindManyArgs;

  const rows = await prisma.dispatchUnit.findMany(args);

  return toCursorPage(rows, take);
}

export async function getDispatchUnitById(input: { communityId: string; unitId: string }) {
  return prisma.dispatchUnit.findFirst({
    where: { id: input.unitId, communityId: input.communityId },
    include: {
      assignedCall: { select: { id: true, title: true, status: true, priority: true } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 60,
        include: { createdByUser: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createDispatchUnit(input: {
  communityId: string;
  actorUserId: string;
  callSign: string;
  type: DispatchUnitType;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const callSign = input.callSign.trim();
  if (callSign.length < 2 || callSign.length > 32) {
    throw new Error("Call sign must be 2-32 characters.");
  }

  return prisma.$transaction(async (tx) => {
    const unit = await tx.dispatchUnit.create({
      data: {
        communityId: input.communityId,
        callSign,
        type: input.type,
        status: DispatchUnitStatus.AVAILABLE,
      },
      select: { id: true, callSign: true, type: true, status: true },
    });

    await tx.dispatchEvent.create({
      data: {
        communityId: input.communityId,
        unitId: unit.id,
        type: "unit.created",
        message: `Unit created: ${unit.callSign}`,
        createdByUserId: input.actorUserId,
      },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: "dispatch.unit.created",
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          unitId: unit.id,
          callSign: unit.callSign,
          type: unit.type,
        } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return unit;
  });
}

export async function updateDispatchUnitStatus(input: {
  communityId: string;
  actorUserId: string;
  unitId: string;
  status: DispatchUnitStatus;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const updated = await prisma.dispatchUnit.updateMany({
    where: { id: input.unitId, communityId: input.communityId },
    data: { status: input.status },
  });

  if (updated.count !== 1) {
    await logTenantViolationIfExists({
      actorUserId: input.actorUserId,
      actorCommunityId: input.communityId,
      resource: "dispatch_unit",
      resourceId: input.unitId,
      operation: "write",
    });
    throw new Error("Unit not found.");
  }

  await prisma.dispatchEvent.create({
    data: {
      communityId: input.communityId,
      unitId: input.unitId,
      type: "unit.status_changed",
      message: `Status set to ${input.status}`,
      createdByUserId: input.actorUserId,
    },
  });

  await createAuditLog({
    communityId: input.communityId,
    userId: input.actorUserId,
    eventType: "dispatch.unit.status_changed",
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { unitId: input.unitId, status: input.status } as unknown as Prisma.InputJsonValue,
  });

  return { ok: true } as const;
}

export async function assignDispatchUnitToCall(input: {
  communityId: string;
  actorUserId: string;
  actorRolePriority: number;
  callId: string;
  unitId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const [call, unit] = await Promise.all([
      tx.dispatchCall.findFirst({
        where: { id: input.callId, communityId: input.communityId },
        select: { id: true, title: true, status: true },
      }),
      tx.dispatchUnit.findFirst({
        where: { id: input.unitId, communityId: input.communityId },
        select: { id: true, callSign: true, status: true, assignedCallId: true },
      }),
    ]);

    if (!call) {
      await logTenantViolationIfExists({
        actorUserId: input.actorUserId,
        actorCommunityId: input.communityId,
        resource: "dispatch_call",
        resourceId: input.callId,
        operation: "write",
      });
      throw new Error("Call not found.");
    }

    if (!unit) {
      await logTenantViolationIfExists({
        actorUserId: input.actorUserId,
        actorCommunityId: input.communityId,
        resource: "dispatch_unit",
        resourceId: input.unitId,
        operation: "write",
      });
      throw new Error("Unit not found.");
    }

    if (
      call.status === DispatchCallStatus.CANCELLED ||
      call.status === DispatchCallStatus.CLEARED
    ) {
      throw new Error("Cannot assign units to a closed call.");
    }

    if (unit.assignedCallId && unit.assignedCallId !== call.id) {
      throw new Error("Unit is already assigned to another call.");
    }

    await tx.dispatchAssignment.create({
      data: {
        communityId: input.communityId,
        callId: call.id,
        unitId: unit.id,
        assignedByUserId: input.actorUserId,
      },
      select: { id: true },
    });

    await tx.dispatchUnit.update({
      where: { id: unit.id },
      data: { assignedCallId: call.id, status: DispatchUnitStatus.ASSIGNED },
      select: { id: true },
    });

    if (call.status === DispatchCallStatus.OPEN) {
      await tx.dispatchCall.update({
        where: { id: call.id },
        data: { status: DispatchCallStatus.ASSIGNED },
        select: { id: true },
      });

      await tx.dispatchEvent.create({
        data: {
          communityId: input.communityId,
          callId: call.id,
          type: "call.status_changed",
          message: `Status: OPEN -> ASSIGNED`,
          createdByUserId: input.actorUserId,
        },
      });

      await createAuditLog(
        {
          communityId: input.communityId,
          userId: input.actorUserId,
          eventType: "dispatch.call.status_changed",
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: {
            callId: call.id,
            from: DispatchCallStatus.OPEN,
            to: DispatchCallStatus.ASSIGNED,
          } as unknown as Prisma.InputJsonValue,
        },
        tx,
      );
    }

    await tx.dispatchEvent.create({
      data: {
        communityId: input.communityId,
        callId: call.id,
        unitId: unit.id,
        type: "assignment.created",
        message: `Unit ${unit.callSign} assigned to call.`,
        createdByUserId: input.actorUserId,
      },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: "dispatch.assignment.created",
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: { callId: call.id, unitId: unit.id } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { ok: true as const };
  });
}

export async function unassignDispatchUnit(input: {
  communityId: string;
  actorUserId: string;
  unitId: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const unit = await tx.dispatchUnit.findFirst({
      where: { id: input.unitId, communityId: input.communityId },
      select: { id: true, callSign: true, assignedCallId: true },
    });

    if (!unit) {
      await logTenantViolationIfExists({
        actorUserId: input.actorUserId,
        actorCommunityId: input.communityId,
        resource: "dispatch_unit",
        resourceId: input.unitId,
        operation: "write",
      });
      throw new Error("Unit not found.");
    }

    const callId = unit.assignedCallId;

    await tx.dispatchUnit.update({
      where: { id: unit.id },
      data: { assignedCallId: null, status: DispatchUnitStatus.AVAILABLE },
      select: { id: true },
    });

    await tx.dispatchEvent.create({
      data: {
        communityId: input.communityId,
        callId: callId ?? undefined,
        unitId: unit.id,
        type: "assignment.removed",
        message: `Unit ${unit.callSign} unassigned.`,
        createdByUserId: input.actorUserId,
      },
    });

    await createAuditLog(
      {
        communityId: input.communityId,
        userId: input.actorUserId,
        eventType: "dispatch.assignment.removed",
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: { unitId: unit.id, callId } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    return { ok: true as const };
  });
}
