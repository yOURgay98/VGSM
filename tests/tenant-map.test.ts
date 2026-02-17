import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    mapPOI: {
      findUnique: vi.fn(),
    },
    mapZone: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn(),
  AuditEvent: {
    TENANT_VIOLATION: "tenant.violation",
  },
}));

vi.mock("@/lib/services/security-events", () => ({
  createSecurityEvent: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { createSecurityEvent } from "@/lib/services/security-events";
import { logTenantViolationIfExists } from "@/lib/services/tenant";

describe("tenant violation logging for map resources", () => {
  beforeEach(() => {
    (prisma.mapPOI.findUnique as any).mockReset();
    (prisma.mapZone.findUnique as any).mockReset();
    (createAuditLog as any).mockReset();
    (createSecurityEvent as any).mockReset();
  });

  it("returns false when map POI does not exist", async () => {
    (prisma.mapPOI.findUnique as any).mockResolvedValue(null);
    const ok = await logTenantViolationIfExists({
      actorUserId: "u1",
      actorCommunityId: "c1",
      resource: "map_poi",
      resourceId: "poi1",
      operation: "write",
    });
    expect(ok).toBe(false);
    expect(createAuditLog).not.toHaveBeenCalled();
    expect(createSecurityEvent).not.toHaveBeenCalled();
  });

  it("returns false when map POI belongs to actor community", async () => {
    (prisma.mapPOI.findUnique as any).mockResolvedValue({ communityId: "c1" });
    const ok = await logTenantViolationIfExists({
      actorUserId: "u1",
      actorCommunityId: "c1",
      resource: "map_poi",
      resourceId: "poi1",
      operation: "delete",
    });
    expect(ok).toBe(false);
    expect(createAuditLog).not.toHaveBeenCalled();
    expect(createSecurityEvent).not.toHaveBeenCalled();
  });

  it("logs CRITICAL cross-tenant access attempt for map POI", async () => {
    (prisma.mapPOI.findUnique as any).mockResolvedValue({ communityId: "c_other" });
    (createSecurityEvent as any).mockResolvedValue({ id: "se1" });

    const ok = await logTenantViolationIfExists({
      actorUserId: "u1",
      actorCommunityId: "c1",
      resource: "map_poi",
      resourceId: "poi1",
      operation: "read",
    });

    expect(ok).toBe(true);
    expect(createAuditLog).toHaveBeenCalledTimes(1);
    expect((createAuditLog as any).mock.calls[0][0]).toMatchObject({
      communityId: "c1",
      userId: "u1",
      eventType: "tenant.violation",
      metadata: {
        operation: "read",
        resource: "map_poi",
        resourceId: "poi1",
        resourceCommunityId: "c_other",
      },
    });

    expect(createSecurityEvent).toHaveBeenCalledTimes(1);
    expect((createSecurityEvent as any).mock.calls[0][0]).toMatchObject({
      communityId: "c1",
      userId: "u1",
      severity: "CRITICAL",
      eventType: "cross_tenant_access_attempt",
      metadata: {
        operation: "read",
        resource: "map_poi",
        resourceId: "poi1",
        resourceCommunityId: "c_other",
      },
    });
  });

  it("logs CRITICAL cross-tenant access attempt for map Zone", async () => {
    (prisma.mapZone.findUnique as any).mockResolvedValue({ communityId: "c_other" });
    (createSecurityEvent as any).mockResolvedValue({ id: "se2" });

    const ok = await logTenantViolationIfExists({
      actorUserId: "u1",
      actorCommunityId: "c1",
      resource: "map_zone",
      resourceId: "zone1",
      operation: "export",
    });

    expect(ok).toBe(true);
    expect(createAuditLog).toHaveBeenCalledTimes(1);
    expect(createSecurityEvent).toHaveBeenCalledTimes(1);
  });
});
