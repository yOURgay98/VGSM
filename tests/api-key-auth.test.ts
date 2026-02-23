import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    apiKey: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  AuditEvent: {
    API_KEY_USED: "api_key.used",
  },
}));

import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/security/api-key";
import { ApiKeyAuthError, requireApiKeyFromRequest } from "@/lib/services/api-key-auth";

describe("API key auth", () => {
  beforeEach(() => {
    (prisma.apiKey.findUnique as any).mockReset();
    (prisma.apiKey.updateMany as any).mockReset();
    (prisma.apiKey.updateMany as any).mockResolvedValue({ count: 1 });
  });

  it("rejects missing key", async () => {
    const req = new Request("http://localhost/api/bot/test");
    await expect(requireApiKeyFromRequest(req)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects invalid/short key", async () => {
    const req = new Request("http://localhost/api/bot/test", { headers: { "x-api-key": "short" } });
    await expect(requireApiKeyFromRequest(req)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects revoked key", async () => {
    const token = "test_token_12345678901234567890";
    const keyHash = hashApiKey(token);
    (prisma.apiKey.findUnique as any).mockResolvedValue({
      id: "k1",
      communityId: "c1",
      name: "bot",
      revokedAt: new Date(),
      permissionsJson: ["approvals:decide"],
    });

    const req = new Request("http://localhost/api/bot/test", { headers: { "x-api-key": token } });
    await expect(requireApiKeyFromRequest(req)).rejects.toBeInstanceOf(ApiKeyAuthError);
    expect((prisma.apiKey.findUnique as any).mock.calls[0][0]).toEqual({
      where: { keyHash },
      select: {
        id: true,
        communityId: true,
        name: true,
        revokedAt: true,
        lastUsedAt: true,
        permissionsJson: true,
      },
    });
  });

  it("rejects when required permission missing", async () => {
    const token = "test_token_12345678901234567890";
    (prisma.apiKey.findUnique as any).mockResolvedValue({
      id: "k1",
      communityId: "c1",
      name: "bot",
      revokedAt: null,
      permissionsJson: ["players:read"],
    });

    const req = new Request("http://localhost/api/bot/test", { headers: { "x-api-key": token } });
    await expect(
      requireApiKeyFromRequest(req, { requiredPermission: "approvals:decide" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("returns context for valid key", async () => {
    const token = "test_token_12345678901234567890";
    (prisma.apiKey.findUnique as any).mockResolvedValue({
      id: "k1",
      communityId: "c1",
      name: "bot",
      revokedAt: null,
      permissionsJson: ["approvals:decide", "dispatch:read"],
    });

    const req = new Request("http://localhost/api/bot/test", { headers: { "x-api-key": token } });
    const ctx = await requireApiKeyFromRequest(req, { requiredPermission: "approvals:decide" });
    expect(ctx).toEqual({
      id: "k1",
      communityId: "c1",
      name: "bot",
      permissions: ["approvals:decide", "dispatch:read"],
    });
    expect((prisma.apiKey.updateMany as any).mock.calls[0][0]).toMatchObject({
      where: { id: "k1", revokedAt: null },
    });
  });
});
