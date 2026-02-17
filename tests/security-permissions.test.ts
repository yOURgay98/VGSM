import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";

import { hasPermission, Permission } from "../lib/security/permissions";

describe("RBAC permission matrix", () => {
  it("grants viewer read-only access", () => {
    expect(hasPermission(Role.VIEWER, Permission.PLAYERS_READ)).toBe(true);
    expect(hasPermission(Role.VIEWER, Permission.SETTINGS_EDIT)).toBe(false);
  });

  it("grants trial mods player edit and command run", () => {
    expect(hasPermission(Role.TRIAL_MOD, Permission.PLAYERS_EDIT)).toBe(true);
    expect(hasPermission(Role.TRIAL_MOD, Permission.COMMANDS_RUN)).toBe(true);
    expect(hasPermission(Role.TRIAL_MOD, Permission.USERS_EDIT_ROLE)).toBe(false);
  });

  it("grants owners user disable", () => {
    expect(hasPermission(Role.OWNER, Permission.USERS_DISABLE)).toBe(true);
  });
});
