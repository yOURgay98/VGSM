import { z } from "zod";

export const generalSettingsSchema = z.object({
  communityName: z.string().trim().min(2).max(100),
  theme: z.enum(["light", "dark", "gray"]),
  tempBanPresets: z
    .array(
      z.coerce
        .number()
        .int()
        .positive()
        .max(60 * 24 * 30),
    )
    .min(1),
});

export const roleAssignmentSchema = z.object({
  targetUserId: z.string().cuid(),
  role: z.enum(["OWNER", "ADMIN", "MOD", "TRIAL_MOD", "VIEWER"]),
});
