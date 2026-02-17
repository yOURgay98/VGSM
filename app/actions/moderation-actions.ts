"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { AppError, actionErrorResult } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { updateCaseStatus } from "@/lib/services/case";
import { createModerationMacro, deleteModerationMacro } from "@/lib/services/moderation";
import { assignReport, updateReportStatus } from "@/lib/services/report";
import {
  createModerationMacroSchema,
  deleteModerationMacroSchema,
  moderationBulkActionSchema,
} from "@/lib/validations/moderation";

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

function ok(message: string): ActionResult {
  return { ok: true, message };
}

function assertPermission(
  actor: Awaited<ReturnType<typeof requirePermission>>,
  permission: Permission,
) {
  if (!actor.permissions.includes(permission)) {
    throw new AppError({
      code: "forbidden",
      message: `Missing permission: ${permission}`,
    });
  }
}

function revalidateModerationPaths() {
  revalidatePath("/app/moderation");
  revalidatePath("/app/reports");
  revalidatePath("/app/cases");
  revalidatePath("/app/inbox");
  revalidatePath("/app/dashboard");
}

export async function runModerationQueueAction(rawInput: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission(Permission.REPORTS_READ);
    const parsed = moderationBulkActionSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid moderation action payload.",
      });
    }

    const { operation, items, reason } = parsed.data;

    for (const item of items) {
      if (operation === "assign_to_me") {
        if (item.kind === "report") {
          assertPermission(actor, Permission.REPORTS_TRIAGE);
          await assignReport({
            communityId: actor.communityId,
            reportId: item.id,
            assignedToUserId: actor.id,
            actorUserId: actor.id,
          });
          continue;
        }

        assertPermission(actor, Permission.CASES_ASSIGN);
        const updated = await prisma.case.updateMany({
          where: { id: item.id, communityId: actor.communityId },
          data: { assignedToUserId: actor.id },
        });
        if (updated.count !== 1) {
          throw new AppError({ code: "not_found", message: "Case not found." });
        }
        await createAuditLog({
          communityId: actor.communityId,
          userId: actor.id,
          eventType: AuditEvent.CASE_UPDATED,
          metadata: { caseId: item.id, assignedToUserId: actor.id },
        });
        continue;
      }

      if (operation === "in_review") {
        if (item.kind === "report") {
          assertPermission(actor, Permission.REPORTS_TRIAGE);
          await updateReportStatus({
            communityId: actor.communityId,
            reportId: item.id,
            status: "IN_REVIEW",
            actorUserId: actor.id,
          });
          continue;
        }

        assertPermission(actor, Permission.CASES_ASSIGN);
        await updateCaseStatus({
          communityId: actor.communityId,
          caseId: item.id,
          status: "IN_REVIEW",
          actorUserId: actor.id,
        });
        continue;
      }

      if (item.kind === "report") {
        assertPermission(actor, Permission.REPORTS_RESOLVE);
        await updateReportStatus({
          communityId: actor.communityId,
          reportId: item.id,
          status: "RESOLVED",
          actorUserId: actor.id,
        });
        continue;
      }

      assertPermission(actor, Permission.CASES_CLOSE);
      await updateCaseStatus({
        communityId: actor.communityId,
        caseId: item.id,
        status: "RESOLVED",
        actorUserId: actor.id,
      });
    }

    if (reason && reason.trim()) {
      await createAuditLog({
        communityId: actor.communityId,
        userId: actor.id,
        eventType: "moderation.resolve_note",
        metadata: {
          operation,
          reason: reason.trim(),
          items: items.map((item) => ({ id: item.id, kind: item.kind })),
        } as Prisma.InputJsonValue,
      });
    }

    revalidateModerationPaths();

    const summary =
      operation === "assign_to_me"
        ? "Assigned selected items."
        : operation === "in_review"
          ? "Marked selected items as in review."
          : "Resolved selected items.";

    return ok(summary);
  } catch (error) {
    return actionErrorResult(error, "Unable to run moderation action.");
  }
}

export async function createModerationMacroAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await requirePermission(Permission.SETTINGS_EDIT);

    const parsed = createModerationMacroSchema.safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      templateText: formData.get("templateText"),
    });

    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid macro payload.",
      });
    }

    await createModerationMacro({
      communityId: actor.communityId,
      actorUserId: actor.id,
      name: parsed.data.name,
      type: parsed.data.type,
      templateText: parsed.data.templateText,
    });

    revalidateModerationPaths();
    return ok("Macro created.");
  } catch (error) {
    return actionErrorResult(error, "Unable to create macro.");
  }
}

export async function deleteModerationMacroAction(macroId: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission(Permission.SETTINGS_EDIT);
    const parsed = deleteModerationMacroSchema.safeParse({ macroId });

    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid macro id.",
      });
    }

    await deleteModerationMacro({
      communityId: actor.communityId,
      actorUserId: actor.id,
      macroId: parsed.data.macroId,
    });

    revalidateModerationPaths();
    return ok("Macro deleted.");
  } catch (error) {
    return actionErrorResult(error, "Unable to delete macro.");
  }
}
