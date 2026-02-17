import { z } from "zod";

export const createActionSchema = z.object({
  type: z.enum(["WARNING", "KICK", "TEMP_BAN", "PERM_BAN", "NOTE", "CLEAR"]),
  playerId: z.string().cuid(),
  reason: z.string().trim().min(6, "Reason is required."),
  durationMinutes: z.coerce
    .number()
    .int()
    .positive()
    .max(60 * 24 * 365)
    .optional(),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
  caseId: z.string().cuid().optional(),
});
