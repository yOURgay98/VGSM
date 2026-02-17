import { Permission, type Permission as PermissionType } from "@/lib/security/permissions";

export const PERMISSION_GROUPS: Array<{
  id: string;
  label: string;
  permissions: readonly PermissionType[];
}> = [
  {
    id: "users",
    label: "Users",
    permissions: [
      Permission.USERS_READ,
      Permission.USERS_INVITE,
      Permission.USERS_EDIT_ROLE,
      Permission.USERS_DISABLE,
    ],
  },
  {
    id: "players",
    label: "Players",
    permissions: [Permission.PLAYERS_READ, Permission.PLAYERS_EDIT, Permission.PLAYERS_FLAG],
  },
  {
    id: "moderation",
    label: "Actions & Bans",
    permissions: [
      Permission.ACTIONS_CREATE,
      Permission.ACTIONS_REVOKE,
      Permission.ACTIONS_EDIT_REASON,
      Permission.BANS_CREATE,
      Permission.BANS_EXTEND,
      Permission.BANS_REMOVE,
    ],
  },
  {
    id: "cases",
    label: "Cases",
    permissions: [
      Permission.CASES_READ,
      Permission.CASES_CREATE,
      Permission.CASES_ASSIGN,
      Permission.CASES_CLOSE,
      Permission.CASES_COMMENT,
    ],
  },
  {
    id: "reports",
    label: "Reports",
    permissions: [Permission.REPORTS_READ, Permission.REPORTS_TRIAGE, Permission.REPORTS_RESOLVE],
  },
  {
    id: "dispatch",
    label: "Dispatch",
    permissions: [Permission.DISPATCH_READ, Permission.DISPATCH_MANAGE],
  },
  {
    id: "map",
    label: "Map",
    permissions: [Permission.MAP_MANAGE_LAYERS],
  },
  {
    id: "ops",
    label: "Operations",
    permissions: [
      Permission.AUDIT_READ,
      Permission.SECURITY_READ,
      Permission.SETTINGS_EDIT,
      Permission.APPROVALS_DECIDE,
      Permission.VIEWS_MANAGE,
    ],
  },
  {
    id: "commands",
    label: "Commands",
    permissions: [Permission.COMMANDS_RUN, Permission.COMMANDS_MANAGE],
  },
  {
    id: "platform",
    label: "Platform",
    permissions: [Permission.API_KEYS_MANAGE],
  },
];

const LABELS: Record<PermissionType, string> = {
  [Permission.USERS_READ]: "Read users",
  [Permission.USERS_INVITE]: "Create invites",
  [Permission.USERS_EDIT_ROLE]: "Manage roles",
  [Permission.USERS_DISABLE]: "Disable user accounts",

  [Permission.PLAYERS_READ]: "Read players",
  [Permission.PLAYERS_EDIT]: "Edit players",
  [Permission.PLAYERS_FLAG]: "Flag players",

  [Permission.ACTIONS_CREATE]: "Create actions",
  [Permission.ACTIONS_REVOKE]: "Revoke actions",
  [Permission.ACTIONS_EDIT_REASON]: "Edit action reasons",

  [Permission.BANS_CREATE]: "Create bans",
  [Permission.BANS_EXTEND]: "Extend bans",
  [Permission.BANS_REMOVE]: "Remove bans",

  [Permission.CASES_READ]: "Read cases",
  [Permission.CASES_CREATE]: "Create cases",
  [Permission.CASES_ASSIGN]: "Assign cases",
  [Permission.CASES_CLOSE]: "Close cases",
  [Permission.CASES_COMMENT]: "Comment on cases",

  [Permission.REPORTS_READ]: "Read reports",
  [Permission.REPORTS_TRIAGE]: "Triage reports",
  [Permission.REPORTS_RESOLVE]: "Resolve reports",

  [Permission.AUDIT_READ]: "Read audit logs",
  [Permission.SECURITY_READ]: "Read security dashboard",
  [Permission.SETTINGS_EDIT]: "Edit settings",

  [Permission.COMMANDS_RUN]: "Run commands",
  [Permission.COMMANDS_MANAGE]: "Manage commands",
  [Permission.APPROVALS_DECIDE]: "Decide approvals",

  [Permission.VIEWS_MANAGE]: "Manage saved views",
  [Permission.API_KEYS_MANAGE]: "Manage API keys",

  [Permission.DISPATCH_READ]: "Read dispatch",
  [Permission.DISPATCH_MANAGE]: "Manage dispatch",

  [Permission.MAP_MANAGE_LAYERS]: "Manage map layers",
};

export function formatPermissionLabel(permission: PermissionType) {
  return LABELS[permission] ?? permission;
}

export const OWNER_ONLY_PERMISSIONS: readonly PermissionType[] = [
  Permission.USERS_DISABLE,
  Permission.API_KEYS_MANAGE,
];
