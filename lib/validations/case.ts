import { z } from "zod";

export const createCaseSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(2000),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]).default("OPEN"),
  assignedToUserId: z.string().cuid().optional(),
  playerIds: z.array(z.string().cuid()).default([]),
  reportIds: z.array(z.string().cuid()).default([]),
});

export const addCaseCommentSchema = z.object({
  caseId: z.string().cuid(),
  body: z.string().trim().min(2).max(1000),
});

export const updateCaseStatusSchema = z.object({
  caseId: z.string().cuid(),
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"]),
});

export const linkCaseActionSchema = z.object({
  caseId: z.string().cuid(),
  actionId: z.string().cuid(),
});
