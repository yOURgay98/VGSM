import { describe, expect, it } from "vitest";

import { createInviteSchema } from "@/lib/validations/invite";

describe("createInviteSchema", () => {
  it("accepts template-based payload with datetime-local expiration", () => {
    const parsed = createInviteSchema.safeParse({
      roleId: "",
      templateId: "tpl_123",
      expiresAt: "2026-03-01T18:30",
      maxUses: "3",
      require2fa: false,
      requireApproval: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.templateId).toBe("tpl_123");
      expect(parsed.data.maxUses).toBe(3);
      expect(parsed.data.expiresAt).toContain("2026-03-01T");
    }
  });

  it("requires role or template", () => {
    const parsed = createInviteSchema.safeParse({
      roleId: "",
      templateId: "",
      expiresAt: "",
      maxUses: "1",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("Please select");
    }
  });

  it("returns a clear error for invalid expiration date", () => {
    const parsed = createInviteSchema.safeParse({
      roleId: "role_123",
      templateId: "",
      expiresAt: "not-a-date",
      maxUses: "1",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find((entry) => entry.path[0] === "expiresAt");
      expect(issue?.message).toBe("Invite expiration must be a valid date.");
    }
  });
});

