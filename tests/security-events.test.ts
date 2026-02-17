import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/security-settings", () => ({
  getSecuritySettings: vi.fn(async () => ({
    autoFreezeEnabled: false,
    autoFreezeThreshold: "CRITICAL",
  })),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    commandExecution: {
      count: vi.fn(),
    },
    approvalRequest: {
      count: vi.fn(),
    },
    securityEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  maybeRecordApprovalSpam,
  maybeRecordHighRiskCommandBurst,
} from "@/lib/services/security-events";

describe("security event generation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    (prisma.commandExecution.count as any).mockReset();
    (prisma.approvalRequest.count as any).mockReset();
    (prisma.securityEvent.findFirst as any).mockReset();
    (prisma.securityEvent.create as any).mockReset();
  });

  it("records high_risk_command_burst once threshold reached", async () => {
    (prisma.commandExecution.count as any).mockResolvedValue(3);
    (prisma.securityEvent.findFirst as any).mockResolvedValue(null);
    (prisma.securityEvent.create as any).mockResolvedValue({
      id: "se1",
      communityId: "c1",
      userId: "u1",
      severity: "HIGH",
      eventType: "high_risk_command_burst",
      metadata: { count: 3, windowMinutes: 10 },
      createdAt: new Date(),
    });

    await maybeRecordHighRiskCommandBurst({ communityId: "c1", userId: "u1" });

    expect(prisma.securityEvent.create).toHaveBeenCalledTimes(1);
    expect((prisma.securityEvent.create as any).mock.calls[0][0]).toMatchObject({
      data: {
        communityId: "c1",
        userId: "u1",
        severity: "HIGH",
        eventType: "high_risk_command_burst",
      },
    });
    expect((prisma.securityEvent.create as any).mock.calls[0][0].data.metadata).toEqual({
      count: 3,
      windowMinutes: 10,
    });
  });

  it("does not record high_risk_command_burst below threshold", async () => {
    (prisma.commandExecution.count as any).mockResolvedValue(2);
    await maybeRecordHighRiskCommandBurst({ communityId: "c1", userId: "u1" });
    expect(prisma.securityEvent.create).not.toHaveBeenCalled();
  });

  it("records approval_spam once threshold reached", async () => {
    (prisma.approvalRequest.count as any).mockResolvedValue(5);
    (prisma.securityEvent.findFirst as any).mockResolvedValue(null);
    (prisma.securityEvent.create as any).mockResolvedValue({
      id: "se2",
      communityId: "c1",
      userId: "u1",
      severity: "MEDIUM",
      eventType: "approval_spam",
      metadata: { count: 5, windowMinutes: 10 },
      createdAt: new Date(),
    });

    await maybeRecordApprovalSpam({ communityId: "c1", userId: "u1" });

    expect(prisma.securityEvent.create).toHaveBeenCalledTimes(1);
    expect((prisma.securityEvent.create as any).mock.calls[0][0]).toMatchObject({
      data: {
        communityId: "c1",
        userId: "u1",
        severity: "MEDIUM",
        eventType: "approval_spam",
      },
    });
  });
});
