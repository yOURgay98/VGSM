"use server";

import { revalidatePath } from "next/cache";

import {
  addCaseCommentSchema,
  createCaseSchema,
  linkCaseActionSchema,
  updateCaseStatusSchema,
} from "@/lib/validations/case";
import { addCaseComment, createCaseRecord, updateCaseStatus } from "@/lib/services/case";
import { requirePermission } from "@/lib/services/auth";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";

interface MutationResult {
  success: boolean;
  message: string;
}

export async function createCaseAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.CASES_CREATE);

  const playerIds = String(formData.get("playerIds") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const reportIds = String(formData.get("reportIds") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const parsed = createCaseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status") || "OPEN",
    assignedToUserId: formData.get("assignedToUserId") || undefined,
    playerIds,
    reportIds,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid case payload." };
  }

  await createCaseRecord({
    ...parsed.data,
    communityId: user.communityId,
    actorUserId: user.id,
  });

  revalidatePath("/app/cases");
  revalidatePath("/app/dashboard");

  return { success: true, message: "Case created." };
}

export async function addCaseCommentAction(
  caseId: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.CASES_COMMENT);

  const parsed = addCaseCommentSchema.safeParse({
    caseId,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid comment payload.",
    };
  }

  await addCaseComment({
    communityId: user.communityId,
    caseId: parsed.data.caseId,
    body: parsed.data.body,
    userId: user.id,
  });

  revalidatePath(`/app/cases/${caseId}`);

  return { success: true, message: "Comment posted." };
}

export async function updateCaseStatusAction(
  caseId: string,
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.CASES_ASSIGN);

  const parsed = updateCaseStatusSchema.safeParse({
    caseId,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid case status payload.",
    };
  }

  await updateCaseStatus({
    communityId: user.communityId,
    caseId: parsed.data.caseId,
    status: parsed.data.status,
    actorUserId: user.id,
  });

  revalidatePath("/app/cases");
  revalidatePath(`/app/cases/${caseId}`);

  return { success: true, message: "Case status updated." };
}

export async function linkCaseActionAction(
  _prevState: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const user = await requirePermission(Permission.CASES_ASSIGN);

  const parsed = linkCaseActionSchema.safeParse({
    caseId: formData.get("caseId"),
    actionId: formData.get("actionId"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid link payload." };
  }

  const [caseExists, actionExists] = await Promise.all([
    prisma.case.findFirst({
      where: { id: parsed.data.caseId, communityId: user.communityId },
      select: { id: true },
    }),
    prisma.action.findFirst({
      where: { id: parsed.data.actionId, communityId: user.communityId },
      select: { id: true },
    }),
  ]);

  if (!caseExists || !actionExists) {
    return { success: false, message: "Case or action not found in this community." };
  }

  await prisma.caseAction.create({
    data: { caseId: parsed.data.caseId, actionId: parsed.data.actionId },
  });

  revalidatePath("/app/cases");
  revalidatePath(`/app/cases/${parsed.data.caseId}`);

  return { success: true, message: `Action linked by ${user.name}.` };
}
