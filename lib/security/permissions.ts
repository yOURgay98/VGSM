import { Role } from "@prisma/client";

export const Permission = {
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  USERS_EDIT_ROLE: "users:edit_role",
  USERS_DISABLE: "users:disable",

  PLAYERS_READ: "players:read",
  PLAYERS_EDIT: "players:edit",
  PLAYERS_FLAG: "players:flag",

  ACTIONS_CREATE: "actions:create",
  ACTIONS_REVOKE: "actions:revoke",
  ACTIONS_EDIT_REASON: "actions:edit_reason",

  BANS_CREATE: "bans:create",
  BANS_EXTEND: "bans:extend",
  BANS_REMOVE: "bans:remove",

  CASES_READ: "cases:read",
  CASES_CREATE: "cases:create",
  CASES_ASSIGN: "cases:assign",
  CASES_CLOSE: "cases:close",
  CASES_COMMENT: "cases:comment",

  REPORTS_READ: "reports:read",
  REPORTS_TRIAGE: "reports:triage",
  REPORTS_RESOLVE: "reports:resolve",

  AUDIT_READ: "audit:read",
  SECURITY_READ: "security:read",
  SETTINGS_EDIT: "settings:edit",

  COMMANDS_RUN: "commands:run",
  COMMANDS_MANAGE: "commands:manage",
  APPROVALS_DECIDE: "approvals:decide",

  VIEWS_MANAGE: "views:manage",
  API_KEYS_MANAGE: "api_keys:manage",

  DISPATCH_READ: "dispatch:read",
  DISPATCH_MANAGE: "dispatch:manage",

  MAP_MANAGE_LAYERS: "map:manage_layers",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const VIEWER_PERMS: readonly Permission[] = [
  Permission.PLAYERS_READ,
  Permission.CASES_READ,
  Permission.REPORTS_READ,
];

const TRIAL_MOD_PERMS: readonly Permission[] = [
  ...VIEWER_PERMS,
  Permission.PLAYERS_EDIT,
  Permission.ACTIONS_CREATE,
  Permission.BANS_CREATE,
  Permission.REPORTS_TRIAGE,
  Permission.CASES_COMMENT,
  Permission.COMMANDS_RUN,
  Permission.VIEWS_MANAGE,
  Permission.DISPATCH_READ,
];

const MOD_PERMS: readonly Permission[] = [
  ...TRIAL_MOD_PERMS,
  Permission.PLAYERS_FLAG,
  Permission.CASES_CREATE,
  Permission.CASES_ASSIGN,
  Permission.REPORTS_RESOLVE,
  Permission.BANS_EXTEND,
  Permission.DISPATCH_MANAGE,
  Permission.MAP_MANAGE_LAYERS,
];

const ADMIN_PERMS: readonly Permission[] = [
  ...MOD_PERMS,
  Permission.USERS_READ,
  Permission.USERS_INVITE,
  Permission.USERS_EDIT_ROLE,
  Permission.ACTIONS_REVOKE,
  Permission.BANS_REMOVE,
  Permission.AUDIT_READ,
  Permission.SECURITY_READ,
  Permission.SETTINGS_EDIT,
  Permission.COMMANDS_MANAGE,
  Permission.APPROVALS_DECIDE,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  VIEWER: VIEWER_PERMS,
  TRIAL_MOD: TRIAL_MOD_PERMS,
  MOD: MOD_PERMS,
  ADMIN: ADMIN_PERMS,
  OWNER: [...ADMIN_PERMS, Permission.USERS_DISABLE, Permission.API_KEYS_MANAGE],
} as const;

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
