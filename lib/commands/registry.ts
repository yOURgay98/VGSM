import { RiskLevel } from "@prisma/client";
import { z } from "zod";

import { Permission } from "@/lib/security/permissions";
import type { CommandDefinition, CommandId } from "@/lib/commands/types";

const cuid = () => z.string().cuid();

const reason = z.string().trim().min(8, "Reason must be at least 8 characters.");

function coerceStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(/\r?\n|,/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

const stringList = z.preprocess(coerceStringList, z.array(z.string()));

export const COMMANDS: ReadonlyArray<CommandDefinition<any>> = [
  {
    id: "warning.create",
    name: "Create Warning",
    description: "Record a warning against a player.",
    requiredPermission: Permission.ACTIONS_CREATE,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      playerId: cuid(),
      reason,
    }),
    fields: [
      {
        name: "playerId",
        label: "Player ID",
        type: "text",
        required: true,
        placeholder: "cuid...",
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea",
        required: true,
        placeholder: "Clear, specific reason...",
      },
    ],
  },
  {
    id: "kick.record",
    name: "Issue Kick Record",
    description: "Record a kick event (does not kick in-game).",
    requiredPermission: Permission.ACTIONS_CREATE,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      playerId: cuid(),
      reason,
    }),
    fields: [
      { name: "playerId", label: "Player ID", type: "text", required: true },
      { name: "reason", label: "Reason", type: "textarea", required: true },
    ],
  },
  {
    id: "ban.temp",
    name: "Temp Ban",
    description: "Record a temporary ban with duration and reason.",
    requiredPermission: Permission.BANS_CREATE,
    riskLevel: RiskLevel.MEDIUM,
    schema: z.object({
      playerId: cuid(),
      durationMinutes: z.coerce
        .number()
        .int()
        .min(1)
        .max(60 * 24 * 30),
      reason,
      evidenceUrls: stringList,
    }),
    fields: [
      { name: "playerId", label: "Player ID", type: "text", required: true },
      {
        name: "durationMinutes",
        label: "Duration (minutes)",
        type: "number",
        required: true,
        min: 1,
        max: 43200,
      },
      { name: "reason", label: "Reason", type: "textarea", required: true },
      {
        name: "evidenceUrls",
        label: "Evidence URLs (optional)",
        type: "textarea",
        placeholder: "One per line or comma-separated",
      },
    ],
  },
  {
    id: "ban.perm",
    name: "Permanent Ban",
    description: "Record a permanent ban (approval required by default).",
    requiredPermission: Permission.BANS_CREATE,
    riskLevel: RiskLevel.HIGH,
    schema: z.object({
      playerId: cuid(),
      reason,
      evidenceUrls: stringList,
    }),
    fields: [
      { name: "playerId", label: "Player ID", type: "text", required: true },
      { name: "reason", label: "Reason", type: "textarea", required: true },
      { name: "evidenceUrls", label: "Evidence URLs (optional)", type: "textarea" },
    ],
  },
  {
    id: "ban.extend",
    name: "Extend Temp Ban",
    description: "Extend an existing temp ban action.",
    requiredPermission: Permission.BANS_EXTEND,
    riskLevel: RiskLevel.MEDIUM,
    schema: z.object({
      actionId: cuid(),
      extraMinutes: z.coerce
        .number()
        .int()
        .min(1)
        .max(60 * 24 * 30),
      reason: z.string().trim().min(3),
    }),
    fields: [
      { name: "actionId", label: "Action ID", type: "text", required: true },
      {
        name: "extraMinutes",
        label: "Extra minutes",
        type: "number",
        required: true,
        min: 1,
        max: 43200,
      },
      { name: "reason", label: "Reason", type: "textarea", required: true },
    ],
  },
  {
    id: "ban.remove",
    name: "Remove Ban",
    description: "Revoke an existing ban action (approval required by default).",
    requiredPermission: Permission.BANS_REMOVE,
    riskLevel: RiskLevel.HIGH,
    schema: z.object({
      actionId: cuid(),
      reason: z.string().trim().min(3),
    }),
    fields: [
      { name: "actionId", label: "Action ID", type: "text", required: true },
      { name: "reason", label: "Reason", type: "textarea", required: true },
    ],
  },
  {
    id: "player.flag",
    name: "Flag Player",
    description: "Set a player's status to WATCHED or ACTIVE.",
    requiredPermission: Permission.PLAYERS_FLAG,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      playerId: cuid(),
      status: z.enum(["ACTIVE", "WATCHED"]),
      reason: z.string().trim().optional(),
    }),
    fields: [
      { name: "playerId", label: "Player ID", type: "text", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "WATCHED", label: "WATCHED" },
          { value: "ACTIVE", label: "ACTIVE" },
        ],
      },
      { name: "reason", label: "Reason (optional)", type: "textarea" },
    ],
  },
  {
    id: "note.add",
    name: "Add Note",
    description: "Add a moderation note to a player record.",
    requiredPermission: Permission.ACTIONS_CREATE,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      playerId: cuid(),
      note: z.string().trim().min(3),
    }),
    fields: [
      { name: "playerId", label: "Player ID", type: "text", required: true },
      { name: "note", label: "Note", type: "textarea", required: true },
    ],
  },
  {
    id: "case.from_report",
    name: "Open Case From Report",
    description: "Create a case linked to a report.",
    requiredPermission: Permission.CASES_CREATE,
    riskLevel: RiskLevel.MEDIUM,
    schema: z.object({
      reportId: cuid(),
      title: z.string().trim().min(3).optional(),
      assignToUserId: cuid().optional(),
    }),
    fields: [
      { name: "reportId", label: "Report ID", type: "text", required: true },
      {
        name: "title",
        label: "Title (optional)",
        type: "text",
        placeholder: "Defaults to report summary",
      },
      {
        name: "assignToUserId",
        label: "Assign to user (optional)",
        type: "text",
        placeholder: "User ID",
      },
    ],
  },
  {
    id: "case.assign",
    name: "Assign Case",
    description: "Assign an existing case to a staff member.",
    requiredPermission: Permission.CASES_ASSIGN,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      caseId: cuid(),
      userId: cuid(),
    }),
    fields: [
      { name: "caseId", label: "Case ID", type: "text", required: true },
      { name: "userId", label: "User ID", type: "text", required: true },
    ],
  },
  {
    id: "report.bulk_resolve",
    name: "Bulk Resolve Reports",
    description: "Resolve or reject multiple reports at once.",
    requiredPermission: Permission.REPORTS_RESOLVE,
    riskLevel: RiskLevel.MEDIUM,
    schema: z.object({
      reportIds: z
        .preprocess(coerceStringList, z.array(cuid()))
        .refine((ids) => ids.length > 0, "Provide at least one report id."),
      resolution: z.enum(["RESOLVED", "REJECTED"]),
      note: z.string().trim().optional(),
    }),
    fields: [
      {
        name: "reportIds",
        label: "Report IDs",
        type: "textarea",
        required: true,
        placeholder: "One per line or comma-separated",
      },
      {
        name: "resolution",
        label: "Resolution",
        type: "select",
        required: true,
        options: [
          { value: "RESOLVED", label: "RESOLVED" },
          { value: "REJECTED", label: "REJECTED" },
        ],
      },
      { name: "note", label: "Note (optional)", type: "textarea" },
    ],
  },
  {
    id: "case.export_packet",
    name: "Export Case Packet",
    description: "Open a printable export for a case.",
    requiredPermission: Permission.CASES_READ,
    riskLevel: RiskLevel.LOW,
    schema: z.object({
      caseId: cuid(),
    }),
    fields: [{ name: "caseId", label: "Case ID", type: "text", required: true }],
  },
] as const;

export function getCommandDefinition(id: CommandId) {
  const cmd = COMMANDS.find((c) => c.id === id);
  if (!cmd) {
    throw new Error(`Unknown command: ${id}`);
  }
  return cmd;
}
