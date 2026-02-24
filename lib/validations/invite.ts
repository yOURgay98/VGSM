import { z } from "zod";

function parseInviteExpiry(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed}:00`
    : trimmed;

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export const createInviteSchema = z
  .object({
    roleId: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((value) => value?.trim() ?? ""),
    templateId: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((value) => value?.trim() ?? ""),
    expiresAt: z
      .string()
      .optional()
      .or(z.literal(""))
      .transform((value) => value?.trim() ?? "")
      .superRefine((value, ctx) => {
        if (!value) return;
        if (!parseInviteExpiry(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invite expiration must be a valid date.",
          });
        }
      })
      .transform((value) => {
        if (!value) return undefined;
        return parseInviteExpiry(value)?.toISOString();
      }),
    maxUses: z.coerce.number().int().positive().max(100),
    require2fa: z.coerce.boolean().optional(),
    requireApproval: z.coerce.boolean().optional(),
  })
  .refine((v) => Boolean(v.roleId) || Boolean(v.templateId), {
    message: "Please select a template or role.",
    path: ["templateId"],
  });
