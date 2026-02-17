import { Role } from "@prisma/client";

export const ROLE_PRIORITY: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MOD: 3,
  TRIAL_MOD: 2,
  VIEWER: 1,
};

export const MODERATION_ROLES: Role[] = ["OWNER", "ADMIN", "MOD", "TRIAL_MOD"];

export function hasRoleAtLeast(currentRole: Role, minimumRole: Role) {
  return ROLE_PRIORITY[currentRole] >= ROLE_PRIORITY[minimumRole];
}

export function canGrantRole(granterRole: Role, roleToGrant: Role) {
  if (granterRole === "OWNER") {
    return true;
  }

  if (granterRole === "ADMIN") {
    return roleToGrant !== "OWNER";
  }

  return false;
}

export function canManageRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "OWNER") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return targetRole !== "OWNER" && ROLE_PRIORITY[targetRole] <= ROLE_PRIORITY.MOD;
  }

  return false;
}

export function canPerformModeration(role: Role) {
  return MODERATION_ROLES.includes(role);
}
