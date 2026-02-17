import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";

import {
  authorize,
  assertCanEditRole,
  assertCanDisableUser,
  AuthorizationError,
} from "../lib/security/authorize";
import { Permission } from "../lib/security/permissions";

describe("authorize()", () => {
  it("blocks disabled users", () => {
    expect(() =>
      authorize({ id: "u1", role: Role.ADMIN, disabledAt: new Date() }, Permission.SETTINGS_EDIT),
    ).toThrowError(AuthorizationError);
  });

  it("blocks missing permissions", () => {
    expect(() =>
      authorize({ id: "u1", role: Role.VIEWER, disabledAt: null }, Permission.SETTINGS_EDIT),
    ).toThrowError("Insufficient permissions.");
  });
});

describe("privilege safety rules", () => {
  it("prevents ADMIN from granting OWNER", () => {
    expect(() =>
      assertCanEditRole({ actorRole: Role.ADMIN, targetRole: Role.MOD, newRole: Role.OWNER }),
    ).toThrowError(AuthorizationError);
  });

  it("prevents ADMIN from editing ADMIN peers", () => {
    expect(() =>
      assertCanEditRole({ actorRole: Role.ADMIN, targetRole: Role.ADMIN, newRole: Role.MOD }),
    ).toThrowError(AuthorizationError);
  });

  it("prevents MOD from editing staff accounts", () => {
    expect(() =>
      assertCanEditRole({ actorRole: Role.MOD, targetRole: Role.TRIAL_MOD, newRole: Role.VIEWER }),
    ).toThrowError(AuthorizationError);
  });

  it("requires OWNER to disable users", () => {
    expect(() =>
      assertCanDisableUser({ actorRole: Role.ADMIN, targetRole: Role.VIEWER }),
    ).toThrowError(AuthorizationError);
    expect(() =>
      assertCanDisableUser({ actorRole: Role.OWNER, targetRole: Role.ADMIN }),
    ).not.toThrow();
  });
});
