import {
  ActionType,
  CaseStatus,
  DispatchCallStatus,
  DispatchUnitStatus,
  PlayerStatus,
  ReportStatus,
  Role,
} from "@prisma/client";

export function playerStatusVariant(status: PlayerStatus) {
  return status === "WATCHED" ? "warning" : "success";
}

export function reportStatusVariant(status: ReportStatus) {
  if (status === "OPEN") return "danger";
  if (status === "IN_REVIEW") return "warning";
  if (status === "RESOLVED") return "success";
  return "default";
}

export function caseStatusVariant(status: CaseStatus) {
  if (status === "OPEN") return "danger";
  if (status === "IN_REVIEW") return "warning";
  if (status === "RESOLVED") return "success";
  return "default";
}

export function actionTypeVariant(type: ActionType) {
  if (type === "PERM_BAN" || type === "KICK") return "danger";
  if (type === "TEMP_BAN") return "warning";
  if (type === "WARNING") return "info";
  return "default";
}

export function dispatchCallStatusVariant(status: DispatchCallStatus) {
  if (status === "OPEN") return "danger";
  if (status === "ASSIGNED") return "warning";
  if (status === "ENROUTE" || status === "ON_SCENE") return "info";
  if (status === "CLEARED") return "success";
  return "default";
}

export function dispatchUnitStatusVariant(status: DispatchUnitStatus) {
  if (status === "AVAILABLE") return "success";
  if (status === "ASSIGNED") return "warning";
  if (status === "ENROUTE" || status === "ON_SCENE") return "info";
  return "default";
}

export function roleVariant(role: Role) {
  if (role === "OWNER") return "danger";
  if (role === "ADMIN") return "warning";
  if (role === "MOD") return "info";
  if (role === "TRIAL_MOD") return "default";
  return "default";
}

export function formatRole(role: Role) {
  return role.replace("_", " ");
}

export function formatActionType(type: ActionType) {
  return type.replace("_", " ");
}
