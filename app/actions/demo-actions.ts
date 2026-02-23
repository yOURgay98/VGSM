"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { Permission } from "@/lib/security/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { requirePermission } from "@/lib/services/auth";
import { addCaseComment, createCaseRecord, updateCaseStatus } from "@/lib/services/case";
import { createReport, updateReportStatus } from "@/lib/services/report";

type DemoActionState = { ok: boolean; message: string };

const DEMO_PREFIX = "[Demo]";

export async function seedDemoModeAction(_prev: DemoActionState): Promise<DemoActionState> {
  try {
    const actor = await requirePermission(Permission.SETTINGS_EDIT);
    if (actor.membership.role.name !== "OWNER") {
      return { ok: false, message: "Only OWNER can enable Demo Mode." };
    }

    const communityId = actor.communityId;

    let player = await prisma.player.findFirst({
      where: { communityId, name: `${DEMO_PREFIX} Player One` },
      select: { id: true },
    });
    if (!player) {
      player = await prisma.player.create({
        data: {
          communityId,
          name: `${DEMO_PREFIX} Player One`,
          status: "WATCHED",
          notes: "Seeded for demo walkthrough.",
        },
        select: { id: true },
      });
    }

    let report = await prisma.report.findFirst({
      where: { communityId, summary: { startsWith: `${DEMO_PREFIX}` } },
      orderBy: { createdAt: "desc" },
      select: { id: true, caseId: true, status: true },
    });
    if (!report) {
      const created = await createReport({
        communityId,
        actorUserId: actor.id,
        reporterName: "System Demo",
        reporterContact: "demo@local",
        accusedPlayerId: player.id,
        summary: `${DEMO_PREFIX} Repeated fail-RP behavior near downtown.`,
        status: "OPEN",
      });
      report = { id: created.id, caseId: created.caseId, status: created.status };
    }

    let caseRecord = await prisma.case.findFirst({
      where: { communityId, title: { startsWith: `${DEMO_PREFIX}` } },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });
    if (!caseRecord) {
      const createdCase = await createCaseRecord({
        communityId,
        actorUserId: actor.id,
        title: `${DEMO_PREFIX} Downtown traffic incident`,
        description: "Seeded case for demo path: report -> case -> assignment -> note -> close.",
        assignedToUserId: actor.id,
        playerIds: [player.id],
        reportIds: [report.id],
      });
      caseRecord = { id: createdCase.id, status: createdCase.status };
    }

    await prisma.case.updateMany({
      where: { id: caseRecord.id, communityId },
      data: { assignedToUserId: actor.id },
    });

    const demoNote = `${DEMO_PREFIX} Investigator note added during demo seed.`;
    const existingNote = await prisma.comment.findFirst({
      where: { communityId, caseId: caseRecord.id, body: demoNote },
      select: { id: true },
    });
    if (!existingNote) {
      await addCaseComment({
        communityId,
        caseId: caseRecord.id,
        userId: actor.id,
        body: demoNote,
      });
    }

    if (report.status !== "IN_REVIEW") {
      await updateReportStatus({
        communityId,
        reportId: report.id,
        status: "IN_REVIEW",
        actorUserId: actor.id,
      });
    }

    await updateCaseStatus({
      communityId,
      caseId: caseRecord.id,
      status: "IN_REVIEW",
      actorUserId: actor.id,
    });
    await updateCaseStatus({
      communityId,
      caseId: caseRecord.id,
      status: "CLOSED",
      actorUserId: actor.id,
    });
    await updateReportStatus({
      communityId,
      reportId: report.id,
      status: "RESOLVED",
      actorUserId: actor.id,
    });

    await createAuditLog({
      communityId,
      userId: actor.id,
      eventType: "demo.seeded",
      metadata: {
        reportId: report.id,
        caseId: caseRecord.id,
        playerId: player.id,
      },
    });

    revalidatePath("/app/dashboard");
    revalidatePath("/app/reports");
    revalidatePath("/app/cases");
    revalidatePath("/app/audit");
    revalidatePath("/app/demo-checklist");

    return { ok: true, message: "Demo mode data seeded successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to seed demo mode.",
    };
  }
}

