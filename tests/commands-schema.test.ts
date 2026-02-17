import { describe, expect, it } from "vitest";

import { getCommandDefinition } from "../lib/commands/registry";

describe("command schemas", () => {
  it("ban.perm accepts evidenceUrls as string or array (approval-safe)", () => {
    const cmd = getCommandDefinition("ban.perm" as any);

    const base = {
      playerId: "cmlmoshak0000vymo5jo4al9a",
      reason: "A valid reason string",
    };

    const fromTextarea = cmd.schema.safeParse({
      ...base,
      evidenceUrls: "https://example.com/a\nhttps://example.com/b",
    });
    expect(fromTextarea.success).toBe(true);
    if (fromTextarea.success) {
      expect(Array.isArray((fromTextarea.data as any).evidenceUrls)).toBe(true);
    }

    const fromApproval = cmd.schema.safeParse({
      ...base,
      evidenceUrls: ["https://example.com/a"],
    });
    expect(fromApproval.success).toBe(true);
  });

  it("report.bulk_resolve accepts list input", () => {
    const cmd = getCommandDefinition("report.bulk_resolve" as any);

    const parsed = cmd.schema.safeParse({
      reportIds: "cmlmoshbt0001vymoz3tqjvx8,cmlmoshby0002vymog28r7e68",
      resolution: "RESOLVED",
      note: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(Array.isArray((parsed.data as any).reportIds)).toBe(true);
      expect((parsed.data as any).reportIds.length).toBe(2);
    }
  });
});
