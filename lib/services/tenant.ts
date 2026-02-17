import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { createSecurityEvent } from "@/lib/services/security-events";

export type TenantResource =
  | "player"
  | "case"
  | "report"
  | "action"
  | "approval"
  | "invite"
  | "dispatch_call"
  | "dispatch_unit"
  | "map_poi"
  | "map_zone";

type TenantOperation = "read" | "write" | "delete" | "export";

async function findResourceCommunityId(input: { resource: TenantResource; id: string }) {
  switch (input.resource) {
    case "player": {
      const row = await prisma.player.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "case": {
      const row = await prisma.case.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "report": {
      const row = await prisma.report.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "action": {
      const row = await prisma.action.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "approval": {
      const row = await prisma.approvalRequest.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "invite": {
      const row = await prisma.invite.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "dispatch_call": {
      const row = await prisma.dispatchCall.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "dispatch_unit": {
      const row = await prisma.dispatchUnit.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "map_poi": {
      const row = await prisma.mapPOI.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
    case "map_zone": {
      const row = await prisma.mapZone.findUnique({
        where: { id: input.id },
        select: { communityId: true },
      });
      return row?.communityId ?? null;
    }
  }
}

export async function logTenantViolationIfExists(input: {
  actorUserId: string;
  actorCommunityId: string;
  resource: TenantResource;
  resourceId: string;
  operation: TenantOperation;
}) {
  try {
    const resourceCommunityId = await findResourceCommunityId({
      resource: input.resource,
      id: input.resourceId,
    });
    if (!resourceCommunityId) return false;
    if (resourceCommunityId === input.actorCommunityId) return false;

    await createAuditLog({
      communityId: input.actorCommunityId,
      userId: input.actorUserId,
      eventType: AuditEvent.TENANT_VIOLATION,
      metadata: {
        operation: input.operation,
        resource: input.resource,
        resourceId: input.resourceId,
        resourceCommunityId,
      },
    });

    try {
      await createSecurityEvent({
        communityId: input.actorCommunityId,
        userId: input.actorUserId,
        severity: "CRITICAL",
        eventType: "cross_tenant_access_attempt",
        metadata: {
          operation: input.operation,
          resource: input.resource,
          resourceId: input.resourceId,
          resourceCommunityId,
        },
      });
    } catch {
      // Never let security-event logging break tenant enforcement.
    }

    return true;
  } catch {
    return false;
  }
}
