import { z } from "zod";

export const moderationQueueItemSchema = z.object({
  id: z.string().cuid(),
  kind: z.enum(["report", "case"]),
});

export const moderationBulkActionSchema = z.object({
  operation: z.enum(["assign_to_me", "in_review", "resolve"]),
  items: z.array(moderationQueueItemSchema).min(1).max(50),
  reason: z.string().trim().max(400).optional(),
});

export const createModerationMacroSchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["REPORT_RESOLUTION", "NOTE", "WARNING", "BAN_REASON"]),
  templateText: z.string().trim().min(4).max(800),
});

export const deleteModerationMacroSchema = z.object({
  macroId: z.string().cuid(),
});
