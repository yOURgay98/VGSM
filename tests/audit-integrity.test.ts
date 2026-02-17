import { describe, expect, it } from "vitest";

import { computeAuditHash } from "../lib/security/audit-hash";
import { verifyAuditIntegrity } from "../lib/services/audit-viewer";

function makeLog(input: {
  chainIndex: number;
  prevHash: string | null;
  hash: string | null;
  eventType: string;
  createdAt: Date;
  metadataJson?: unknown;
}) {
  return {
    chainIndex: input.chainIndex,
    prevHash: input.prevHash,
    hash: input.hash,
    userId: "u1",
    eventType: input.eventType,
    ip: null,
    userAgent: null,
    metadataJson: input.metadataJson ?? null,
    createdAt: input.createdAt,
  };
}

describe("audit hash chain integrity", () => {
  it("verifies a valid chain", () => {
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    const t1 = new Date("2026-01-01T00:00:01.000Z");
    const t2 = new Date("2026-01-01T00:00:02.000Z");

    const h1 = computeAuditHash({
      prevHash: null,
      chainIndex: 1,
      communityId: null,
      userId: "u1",
      eventType: "seed.bootstrap",
      ip: null,
      userAgent: null,
      metadata: { a: 1 } as any,
      createdAt: t0,
    });
    const h2 = computeAuditHash({
      prevHash: h1,
      chainIndex: 2,
      communityId: null,
      userId: "u1",
      eventType: "action.created",
      ip: null,
      userAgent: null,
      metadata: null,
      createdAt: t1,
    });
    const h3 = computeAuditHash({
      prevHash: h2,
      chainIndex: 3,
      communityId: null,
      userId: "u1",
      eventType: "login.failed",
      ip: null,
      userAgent: null,
      metadata: { reason: "x" } as any,
      createdAt: t2,
    });

    // Provide logs out-of-order; verifier sorts by chainIndex.
    const logs = [
      makeLog({
        chainIndex: 3,
        prevHash: h2,
        hash: h3,
        eventType: "login.failed",
        createdAt: t2,
        metadataJson: { reason: "x" },
      }),
      makeLog({
        chainIndex: 1,
        prevHash: null,
        hash: h1,
        eventType: "seed.bootstrap",
        createdAt: t0,
        metadataJson: { a: 1 },
      }),
      makeLog({
        chainIndex: 2,
        prevHash: h1,
        hash: h2,
        eventType: "action.created",
        createdAt: t1,
        metadataJson: null,
      }),
    ];

    const integrity = verifyAuditIntegrity(logs);
    expect(integrity.ok).toBe(true);
  });

  it("detects tampering", () => {
    const t0 = new Date("2026-01-01T00:00:00.000Z");
    const h1 = computeAuditHash({
      prevHash: null,
      chainIndex: 1,
      communityId: null,
      userId: "u1",
      eventType: "seed.bootstrap",
      ip: null,
      userAgent: null,
      metadata: { a: 1 } as any,
      createdAt: t0,
    });

    const logs = [
      makeLog({
        chainIndex: 1,
        prevHash: null,
        hash: h1,
        eventType: "seed.bootstrap",
        createdAt: t0,
        metadataJson: { a: 2 },
      }),
    ];

    const integrity = verifyAuditIntegrity(logs);
    expect(integrity.ok).toBe(false);
    expect(integrity.firstBrokenChainIndex).toBe(1);
  });
});
