import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  twoFactorCode: z.string().trim().optional(),
});

export const redeemInviteSchema = z
  .object({
    token: z.string().min(8),
    email: z.string().trim().toLowerCase().email(),
    name: z.string().trim().min(2),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    betaKey: z.string().trim().max(80).optional().nullable(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

export const redeemInviteJoinSchema = z
  .object({
    token: z.string().min(8),
    betaKey: z.string().trim().max(80).optional().nullable(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });
