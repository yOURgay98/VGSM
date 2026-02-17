import { Role } from "@prisma/client";

import { ROLE_PERMISSIONS, type Permission } from "@/lib/security/permissions";
import { ROLE_PRIORITY } from "@/lib/permissions";

export class AuthorizationError extends Error {
  code: string;

  constructor(message: string, code = "forbidden") {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export function authorize(
  user: { id: string; role?: Role; disabledAt?: Date | null; permissions?: readonly Permission[] },
  permission: Permission,
) {
  assertNotDisabled(user.disabledAt);

  const perms = user.permissions ?? (user.role ? ROLE_PERMISSIONS[user.role] : []);
  if (!perms.includes(permission)) {
    throw new AuthorizationError("Insufficient permissions.");
  }
}

export function assertNotDisabled(disabledAt?: Date | null) {
  if (disabledAt) {
    throw new AuthorizationError("Account disabled.", "disabled");
  }
}

export function assertCanEditRole(input: { actorRole: Role; targetRole: Role; newRole: Role }) {
  const { actorRole, targetRole, newRole } = input;

  if (actorRole !== "OWNER" && newRole === "OWNER") {
    throw new AuthorizationError("Only OWNER can grant OWNER role.", "role_escalation");
  }

  if (actorRole === "ADMIN") {
    // Admin cannot edit peers/higher.
    if (ROLE_PRIORITY[targetRole] >= ROLE_PRIORITY.ADMIN) {
      throw new AuthorizationError("You cannot edit this user's role.", "role_peer_or_higher");
    }
    if (ROLE_PRIORITY[newRole] >= ROLE_PRIORITY.ADMIN) {
      throw new AuthorizationError("You cannot grant this role.", "role_escalation");
    }
  }

  if (ROLE_PRIORITY[actorRole] < ROLE_PRIORITY.ADMIN) {
    // Mods cannot edit staff accounts at all.
    if (ROLE_PRIORITY[targetRole] >= ROLE_PRIORITY.TRIAL_MOD) {
      throw new AuthorizationError("You cannot edit staff accounts.", "role_staff_edit_blocked");
    }
  }
}

export function assertCanDisableUser(input: { actorRole: Role; targetRole: Role }) {
  const { actorRole, targetRole } = input;

  if (actorRole !== "OWNER") {
    throw new AuthorizationError("Only OWNER can disable users.", "disable_requires_owner");
  }

  if (actorRole === "OWNER" && targetRole === "OWNER") {
    // Owner can disable another owner, but never itself should be guarded by caller.
    return;
  }
}
