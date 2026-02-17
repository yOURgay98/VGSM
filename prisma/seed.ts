import crypto from "node:crypto";
import {
  ActionType,
  ApprovalStatus,
  CaseStatus,
  Prisma,
  PrismaClient,
  ReportStatus,
  RiskLevel,
  Role,
  SavedViewScope,
} from "@prisma/client";

import { COMMANDS } from "../lib/commands/registry";
import { hashPassword } from "../lib/auth/password";
import { createAuditLog } from "../lib/services/audit";
import { DEFAULT_COMMUNITY_ID, ensureCommunitySystemRoles } from "../lib/services/community";

const prisma = new PrismaClient();
const SEED_RESET_DB = process.env.SEED_RESET_DB === "true" || process.env.SEED_RESET_DB === "1";
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === "true" || process.env.SEED_DEMO_DATA === "1";

function generateSeedPassword() {
  return `ESS-DEMO-${crypto.randomBytes(16).toString("base64url")}`;
}

async function resetDatabase() {
  // Delete dependent tables first to satisfy foreign keys.
  await prisma.caseAction.deleteMany();
  await prisma.casePlayer.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.playerInternalNote.deleteMany();
  await prisma.caseInternalNote.deleteMany();
  await prisma.playerTag.deleteMany();
  await prisma.caseTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.caseTemplate.deleteMany();
  await prisma.action.deleteMany();
  await prisma.report.deleteMany();
  await prisma.case.deleteMany();
  await prisma.player.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.inviteTemplate.deleteMany();
  await prisma.commandExecution.deleteMany();
  await prisma.sensitiveModeGrant.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.savedView.deleteMany();
  await prisma.commandToggle.deleteMany();
  await prisma.twoFactorBackupCode.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.mapViewState.deleteMany();
  await prisma.mapZone.deleteMany();
  await prisma.mapPOI.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.betaAccessKey.deleteMany();
  await prisma.discordCommunityConfig.deleteMany();
  await prisma.discordAccount.deleteMany();
  await prisma.communityMembership.deleteMany();
  await prisma.communityRolePermission.deleteMany();
  await prisma.communityRole.deleteMany();
  await prisma.community.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

async function upsertCommunity(input: { id: string; name: string; slug: string }) {
  return prisma.community.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      name: input.name,
      slug: input.slug,
      settingsJson: {} as unknown as Prisma.InputJsonValue,
    },
    update: {
      name: input.name,
      slug: input.slug,
      settingsJson: {} as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, name: true, slug: true },
  });
}

async function getSystemRoleId(communityId: string, role: Role) {
  const row = await prisma.communityRole.findFirst({
    where: { communityId, name: role, isSystemDefault: true },
    select: { id: true },
  });
  if (!row) {
    throw new Error(`System role ${role} missing for ${communityId}.`);
  }
  return row.id;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    if (SEED_RESET_DB || SEED_DEMO_DATA) {
      throw new Error("Refusing to run destructive/demo seed in production.");
    }
    console.log("Seed skipped (production).");
    return;
  }

  if (SEED_RESET_DB) {
    await resetDatabase();
  } else {
    console.log("Seed: SEED_RESET_DB is not enabled; skipping destructive reset.");
  }

  // Communities (multi-tenant demo)
  const [mainCommunity, trainingCommunity] = await Promise.all(
    SEED_DEMO_DATA
      ? [
          upsertCommunity({ id: DEFAULT_COMMUNITY_ID, name: "ERLC Main", slug: "erlc-main" }),
          upsertCommunity({
            id: "community_training",
            name: "ERLC Training",
            slug: "erlc-training",
          }),
        ]
      : [
          upsertCommunity({ id: DEFAULT_COMMUNITY_ID, name: "ERLC Main", slug: "erlc-main" }),
          Promise.resolve(null),
        ],
  );

  if (trainingCommunity) {
    await Promise.all([
      ensureCommunitySystemRoles(mainCommunity.id),
      ensureCommunitySystemRoles(trainingCommunity.id),
    ]);
  } else {
    await ensureCommunitySystemRoles(mainCommunity.id);
  }

  if (!SEED_DEMO_DATA) {
    console.log("Seeded base community + system roles.");
    console.log("No demo users were created.");
    console.log(
      "Bootstrap an OWNER by setting OWNER_EMAIL + OWNER_BOOTSTRAP_PASSWORD and signing in.",
    );
    return;
  }

  // Users (global accounts; memberships control access per community)
  const ownerPassword = generateSeedPassword();
  const adminPassword = generateSeedPassword();
  const modPassword = generateSeedPassword();
  const trialPassword = generateSeedPassword();
  const viewerPassword = generateSeedPassword();

  const ownerPasswordHash = await hashPassword(ownerPassword);

  const [owner, admin, mod, trialMod, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        email: "owner@example.com",
        name: "Owner Account",
        passwordHash: ownerPasswordHash,
        role: Role.OWNER,
        lastLoginAt: new Date(),
      },
      select: { id: true, email: true, name: true },
    }),
    prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Admin Nova",
        passwordHash: await hashPassword(adminPassword),
        role: Role.ADMIN,
      },
      select: { id: true, email: true, name: true },
    }),
    prisma.user.create({
      data: {
        email: "mod@example.com",
        name: "Mod Orion",
        passwordHash: await hashPassword(modPassword),
        role: Role.MOD,
      },
      select: { id: true, email: true, name: true },
    }),
    prisma.user.create({
      data: {
        email: "trialmod@example.com",
        name: "Trial Mod Sora",
        passwordHash: await hashPassword(trialPassword),
        role: Role.TRIAL_MOD,
      },
      select: { id: true, email: true, name: true },
    }),
    prisma.user.create({
      data: {
        email: "viewer@example.com",
        name: "Viewer Lynx",
        passwordHash: await hashPassword(viewerPassword),
        role: Role.VIEWER,
      },
      select: { id: true, email: true, name: true },
    }),
  ]);

  // Memberships (per-community roles)
  const [mainOwnerRoleId, mainAdminRoleId, mainModRoleId, mainTrialRoleId, mainViewerRoleId] =
    await Promise.all([
      getSystemRoleId(mainCommunity.id, Role.OWNER),
      getSystemRoleId(mainCommunity.id, Role.ADMIN),
      getSystemRoleId(mainCommunity.id, Role.MOD),
      getSystemRoleId(mainCommunity.id, Role.TRIAL_MOD),
      getSystemRoleId(mainCommunity.id, Role.VIEWER),
    ]);

  if (!trainingCommunity) {
    throw new Error("Training community missing (seed demo requires it).");
  }

  const [
    trainingOwnerRoleId,
    trainingAdminRoleId,
    trainingModRoleId,
    trainingTrialRoleId,
    trainingViewerRoleId,
  ] = await Promise.all([
    getSystemRoleId(trainingCommunity.id, Role.OWNER),
    getSystemRoleId(trainingCommunity.id, Role.ADMIN),
    getSystemRoleId(trainingCommunity.id, Role.MOD),
    getSystemRoleId(trainingCommunity.id, Role.TRIAL_MOD),
    getSystemRoleId(trainingCommunity.id, Role.VIEWER),
  ]);

  await prisma.communityMembership.createMany({
    data: [
      { communityId: mainCommunity.id, userId: owner.id, roleId: mainOwnerRoleId },
      { communityId: mainCommunity.id, userId: admin.id, roleId: mainAdminRoleId },
      { communityId: mainCommunity.id, userId: mod.id, roleId: mainModRoleId },
      { communityId: mainCommunity.id, userId: trialMod.id, roleId: mainTrialRoleId },
      { communityId: mainCommunity.id, userId: viewer.id, roleId: mainViewerRoleId },

      { communityId: trainingCommunity.id, userId: owner.id, roleId: trainingOwnerRoleId },
      { communityId: trainingCommunity.id, userId: admin.id, roleId: trainingModRoleId },
      { communityId: trainingCommunity.id, userId: mod.id, roleId: trainingTrialRoleId },
      { communityId: trainingCommunity.id, userId: viewer.id, roleId: trainingViewerRoleId },
    ],
  });

  // Command toggles per community.
  await prisma.commandToggle.createMany({
    data: [mainCommunity, trainingCommunity].flatMap((c) =>
      COMMANDS.map((cmd) => ({
        communityId: c.id,
        id: cmd.id,
        enabled: true,
        updatedByUserId: owner.id,
      })),
    ),
  });

  // Invite templates (scoped to community)
  await prisma.inviteTemplate.createMany({
    data: [
      {
        communityId: mainCommunity.id,
        name: "Staff Invite (Trial Mod)",
        defaultRoleId: mainTrialRoleId,
        expiresInMinutes: 60 * 24,
        maxUses: 10,
        require2fa: false,
        notes: "Standard staff onboarding invite.",
      },
      {
        communityId: mainCommunity.id,
        name: "Admin Invite (2FA Required)",
        defaultRoleId: mainAdminRoleId,
        expiresInMinutes: 60,
        maxUses: 2,
        require2fa: true,
        requireApproval: true,
        notes: "Admin invites should require 2FA on first login.",
      },
      {
        communityId: trainingCommunity.id,
        name: "Training Invite (Viewer)",
        defaultRoleId: trainingViewerRoleId,
        expiresInMinutes: 60 * 24,
        maxUses: 25,
        require2fa: false,
        notes: "For trainees and observers.",
      },
    ],
  });

  // Settings per community.
  await prisma.setting.createMany({
    data: [
      {
        communityId: mainCommunity.id,
        key: "general",
        valueJson: {
          communityName: mainCommunity.name,
          theme: "dark",
          tempBanPresets: [30, 60, 180, 1440],
        } as unknown as Prisma.InputJsonValue,
      },
      {
        communityId: mainCommunity.id,
        key: "security",
        valueJson: {
          require2FAForPrivileged: true,
          twoPersonRule: true,
          requireSensitiveModeForHighRisk: true,
          sensitiveModeTtlMinutes: 10,
          highRiskCommandCooldownSeconds: 60,
          lockoutMaxAttempts: 5,
          lockoutWindowMinutes: 15,
          lockoutDurationMinutes: 15,
        } as unknown as Prisma.InputJsonValue,
      },
      {
        communityId: trainingCommunity.id,
        key: "general",
        valueJson: {
          communityName: trainingCommunity.name,
          theme: "gray",
          tempBanPresets: [15, 30, 60, 180],
        } as unknown as Prisma.InputJsonValue,
      },
      {
        communityId: trainingCommunity.id,
        key: "security",
        valueJson: {
          require2FAForPrivileged: true,
          twoPersonRule: true,
          requireSensitiveModeForHighRisk: true,
          sensitiveModeTtlMinutes: 10,
          highRiskCommandCooldownSeconds: 60,
          lockoutMaxAttempts: 5,
          lockoutWindowMinutes: 15,
          lockoutDurationMinutes: 15,
        } as unknown as Prisma.InputJsonValue,
      },
    ],
  });

  // Discord integration placeholders (no bot token seeded).
  await prisma.discordCommunityConfig.createMany({
    data: [
      {
        communityId: mainCommunity.id,
        guildId: "000000000000000000",
        approvalsChannelId: null,
        dispatchChannelId: null,
        securityChannelId: null,
        botTokenEnc: null,
      },
      {
        communityId: trainingCommunity.id,
        guildId: "000000000000000000",
        approvalsChannelId: null,
        dispatchChannelId: null,
        securityChannelId: null,
        botTokenEnc: null,
      },
    ],
  });

  // Demo data: main community
  const [mainPlayerOne, mainPlayerTwo, mainPlayerThree, mainPlayerFour] = await Promise.all([
    prisma.player.create({
      data: {
        communityId: mainCommunity.id,
        name: "RiverFox",
        robloxId: "1428831",
        discordId: "244001122334455",
        status: "WATCHED",
        notes: "Repeated pursuit evasion during traffic stops.",
      },
    }),
    prisma.player.create({
      data: {
        communityId: mainCommunity.id,
        name: "EchoPilot",
        robloxId: "9927312",
        status: "ACTIVE",
        notes: "Generally cooperative.",
      },
    }),
    prisma.player.create({
      data: {
        communityId: mainCommunity.id,
        name: "NightCourier",
        discordId: "555800122334",
        status: "WATCHED",
        notes: "Potential exploit reports under review.",
      },
    }),
    prisma.player.create({
      data: {
        communityId: mainCommunity.id,
        name: "AtlasUnit",
        robloxId: "7733991",
        status: "ACTIVE",
      },
    }),
  ]);

  const reportOne = await prisma.report.create({
    data: {
      communityId: mainCommunity.id,
      reporterName: "Citizen 204",
      reporterContact: "ticket-4412",
      accusedPlayerId: mainPlayerOne.id,
      summary: "Fail RP and repeated random vehicle ramming in downtown.",
      status: ReportStatus.OPEN,
    },
  });

  const reportTwo = await prisma.report.create({
    data: {
      communityId: mainCommunity.id,
      reporterName: "Traffic Unit 3",
      reporterContact: "discord:officer.3",
      accusedPlayerId: mainPlayerThree.id,
      summary: "Possible combat logging during felony pursuit.",
      status: ReportStatus.IN_REVIEW,
    },
  });

  const actionOne = await prisma.action.create({
    data: {
      communityId: mainCommunity.id,
      type: ActionType.WARNING,
      playerId: mainPlayerOne.id,
      moderatorUserId: mod.id,
      reason: "Vehicle ramming and refusal to follow scene direction.",
      evidenceUrls: ["https://example.com/evidence/warn-1"],
    },
  });

  const actionTwo = await prisma.action.create({
    data: {
      communityId: mainCommunity.id,
      type: ActionType.TEMP_BAN,
      playerId: mainPlayerThree.id,
      moderatorUserId: admin.id,
      reason: "Combat logging while under active pursuit.",
      durationMinutes: 180,
      evidenceUrls: ["https://example.com/evidence/tempban-1"],
    },
  });

  const caseOne = await prisma.case.create({
    data: {
      communityId: mainCommunity.id,
      title: "Downtown Pursuit Incidents",
      description:
        "Multiple reports indicate coordinated Fail RP behavior and possible evasion exploit use. Evidence and witness statements are attached.",
      status: CaseStatus.IN_REVIEW,
      assignedToUserId: admin.id,
      reports: {
        connect: [{ id: reportOne.id }, { id: reportTwo.id }],
      },
      casePlayers: {
        create: [{ playerId: mainPlayerOne.id }, { playerId: mainPlayerThree.id }],
      },
    },
  });

  await prisma.caseAction.createMany({
    data: [
      { caseId: caseOne.id, actionId: actionOne.id },
      { caseId: caseOne.id, actionId: actionTwo.id },
    ],
  });

  await prisma.comment.createMany({
    data: [
      {
        communityId: mainCommunity.id,
        caseId: caseOne.id,
        userId: admin.id,
        body: "Escalated to in-review. Waiting for final clip timestamps.",
      },
      {
        communityId: mainCommunity.id,
        caseId: caseOne.id,
        userId: mod.id,
        body: "Collected witness statements from the scene participants.",
      },
    ],
  });

  await prisma.savedView.create({
    data: {
      communityId: mainCommunity.id,
      userId: admin.id,
      scope: SavedViewScope.REPORTS,
      name: "Unassigned triage",
      filtersJson: {
        status: "OPEN",
        assigned: "unassigned",
      } as unknown as Prisma.InputJsonValue,
    },
  });

  const approval = await prisma.approvalRequest.create({
    data: {
      communityId: mainCommunity.id,
      status: ApprovalStatus.PENDING,
      riskLevel: RiskLevel.HIGH,
      requestedByUserId: mod.id,
      payloadJson: {
        commandId: "ban.perm",
        input: {
          playerId: mainPlayerOne.id,
          reason: "Seeded example: permanent ban request pending approval.",
          evidenceUrls: [],
        },
      } as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  // Demo data: training community
  const trainingPlayer = await prisma.player.create({
    data: {
      communityId: trainingCommunity.id,
      name: "CadetKestrel",
      robloxId: "3133707",
      status: "ACTIVE",
      notes: "New trainee account.",
    },
  });

  await prisma.report.create({
    data: {
      communityId: trainingCommunity.id,
      reporterName: "Trainer Desk",
      reporterContact: "training-ticket-012",
      accusedPlayerId: trainingPlayer.id,
      summary: "Training sandbox incident report (demo).",
      status: ReportStatus.OPEN,
      assignedToUserId: null,
    },
  });

  // Seed audit logs through the chain writer so integrity checks start valid.
  await prisma.$transaction(async (tx) => {
    await createAuditLog(
      {
        userId: owner.id,
        communityId: mainCommunity.id,
        eventType: "seed.bootstrap",
        metadata: { message: "Seed completed (multi-tenant)." } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    await createAuditLog(
      {
        userId: admin.id,
        communityId: mainCommunity.id,
        eventType: "action.created",
        metadata: { actionId: actionTwo.id } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    await createAuditLog(
      {
        userId: viewer.id,
        communityId: mainCommunity.id,
        eventType: "login.failed",
        metadata: { reason: "password_mismatch" } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );

    await createAuditLog(
      {
        userId: mod.id,
        communityId: mainCommunity.id,
        eventType: "approval.requested",
        metadata: { approvalId: approval.id } as unknown as Prisma.InputJsonValue,
      },
      tx,
    );
  });

  console.log("Seeded ERLC Moderation Panel demo data (multi-tenant).");
  console.log("Demo accounts created (passwords are randomly generated):");
  console.log(`OWNER  owner@example.com     ${ownerPassword}`);
  console.log(`ADMIN  admin@example.com     ${adminPassword}`);
  console.log(`MOD    mod@example.com       ${modPassword}`);
  console.log(`TRIAL  trialmod@example.com  ${trialPassword}`);
  console.log(`VIEWER viewer@example.com    ${viewerPassword}`);
  console.log(
    `Communities: ${mainCommunity.name} (${mainCommunity.slug}), ${trainingCommunity.name} (${trainingCommunity.slug})`,
  );
  console.log(
    `Users: ${[owner.email, admin.email, mod.email, trialMod.email, viewer.email].join(", ")}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
