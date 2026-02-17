import { z } from "zod";

export const createInviteSchema = z
  .object({
    roleId: z.string().optional().or(z.literal("")),
    templateId: z.string().optional().or(z.literal("")),
    expiresAt: z.string().datetime().optional().or(z.literal("")),
    maxUses: z.coerce.number().int().positive().max(100),
    require2fa: z.coerce.boolean().optional(),
    requireApproval: z.coerce.boolean().optional(),
  })
  .refine((v) => Boolean(v.roleId) || Boolean(v.templateId), {
    message: "Select a role or template.",
  });
