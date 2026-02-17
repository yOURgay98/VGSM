import { describe, expect, it } from "vitest";

import { canGrantRole, canManageRole, hasRoleAtLeast } from "../lib/permissions";

describe("role permissions", () => {
  it("allows owner to grant owner", () => {
    expect(canGrantRole("OWNER", "OWNER")).toBe(true);
  });

  it("prevents admin from granting owner", () => {
    expect(canGrantRole("ADMIN", "OWNER")).toBe(false);
    expect(canGrantRole("ADMIN", "MOD")).toBe(true);
  });

  it("enforces role hierarchy", () => {
    expect(hasRoleAtLeast("MOD", "TRIAL_MOD")).toBe(true);
    expect(hasRoleAtLeast("TRIAL_MOD", "MOD")).toBe(false);
  });

  it("prevents non-owner from managing owner", () => {
    expect(canManageRole("ADMIN", "OWNER")).toBe(false);
  });
});
