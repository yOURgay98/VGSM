import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().trim().min(2),
  robloxId: z.string().trim().optional(),
  discordId: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "WATCHED"]).default("ACTIVE"),
  notes: z.string().trim().max(500).optional(),
});

export const updatePlayerSchema = createPlayerSchema.partial();
