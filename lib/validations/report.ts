import { z } from "zod";

export const createReportSchema = z.object({
  reporterName: z.string().trim().optional(),
  reporterContact: z.string().trim().optional(),
  accusedPlayerId: z.string().cuid().optional(),
  summary: z.string().trim().min(10).max(1000),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]).default("OPEN"),
});

export const updateReportStatusSchema = z.object({
  reportId: z.string().cuid(),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
});
