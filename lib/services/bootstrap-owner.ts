import crypto from "node:crypto";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { ROLE_PERMISSIONS } from "@/lib/security/permissions";
import { createAuditLog } from "@/lib/services/audit";

const BOOTSTRAP_LOCK_KEY = 3182002;
const DEFAULT_COMMUNITY_ID = "community_default";
const DEFAULT_COMMUNITY_NAME = "Vanguard Main";
const DEFAULT_COMMUNITY_SLUG = "vanguard-main";
const DEFAULT_OWNER_EMAIL = "mangukonto58@gmail.com";

function isValidEmail(value: string) {
  // Simple sanity check; we don't need full RFC compliance for a bootstrap guard.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeEnv(value: string | undefined) {
  const v = (value ?? "").trim();
  return v.length ? v : null;
}

function generateOneTimePassword() {
  // URL-safe, high entropy, easy to paste.
  return `VSM-${crypto.randomBytes(18).toString("base64url")}`;
}

function bootstrapEmail(emailHint: string) {
  const envEmail = normalizeEnv(process.env.OWNER_EMAIL);
  const chosen = envEmail && isValidEmail(envEmail) ? envEmail : DEFAULT_OWNER_EMAIL;
  if (!isValidEmail(chosen)) {
    throw new Error("OWNER_EMAIL is missing/invalid and the default owner email is invalid.");
  }
  return chosen.toLowerCase();
}

function bootstrapPassword() {
  const envPass = normalizeEnv(process.env.OWNER_BOOTSTRAP_PASSWORD);
  if (envPass) return { password: envPass, generated: false as const };
  if (process.env.NODE_ENV === "production") {
    throw new Error("OWNER_BOOTSTRAP_PASSWORD is required in production.");
  }
  return { password: generateOneTimePassword(), generated: true as const };
}

async function ensureDefaultCommunity(
  tx: Prisma.TransactionClient,
): Promise<{ id: string; name: string; slug: string }> {
  const existing = await tx.community.findUnique({
    where: { id: DEFAULT_COMMUNITY_ID },
    select: { id: true, name: true, slug: true },
  });
  if (existing) return existing;

  // Avoid slug collisions if a different community already uses the default slug.
  let slug = DEFAULT_COMMUNITY_SLUG;
  const slugOwner = await tx.community.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (slugOwner && slugOwner.id !== DEFAULT_COMMUNITY_ID) {
    slug = `vsm-${crypto.randomBytes(3).toString("hex")}`;
  }

  return tx.community.create({
    data: {
      id: DEFAULT_COMMUNITY_ID,
      name: DEFAULT_COMMUNITY_NAME,
      slug,
      settingsJson: {} as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, name: true, slug: true },
  });
}

async function ensureSystemRoles(tx: Prisma.TransactionClient, communityId: string) {
  const specs: Array<{ role: Role; priority: number }> = [
    { role: Role.OWNER, priority: ROLE_PRIORITY.OWNER },
    { role: Role.ADMIN, priority: ROLE_PRIORITY.ADMIN },
    { role: Role.MOD, priority: ROLE_PRIORITY.MOD },
    { role: Role.TRIAL_MOD, priority: ROLE_PRIORITY.TRIAL_MOD },
    { role: Role.VIEWER, priority: ROLE_PRIORITY.VIEWER },
  ];

  for (const spec of specs) {
    const roleRecord = await tx.communityRole.upsert({
      where: { communityId_name: { communityId, name: spec.role } },
      create: {
        communityId,
        name: spec.role,
        description: `${spec.role} (system)`,
        isSystemDefault: true,
        priority: spec.priority,
      },
      update: {
        description: `${spec.role} (system)`,
        isSystemDefault: true,
        priority: spec.priority,
      },
      select: { id: true, name: true },
    });

    const perms = ROLE_PERMISSIONS[spec.role] ?? [];
    if (perms.length) {
      await tx.communityRolePermission.createMany({
        data: perms.map((p) => ({ roleId: roleRecord.id, permission: p })),
        skipDuplicates: true,
      });
    }
  }
}

export async function bootstrapOwnerIfNeeded(emailHint: string) {
  // Quick path: if an OWNER already exists, do nothing.
  const existingOwner = await prisma.user.findFirst({
    where: { role: Role.OWNER },
    select: { id: true },
  });
  if (existingOwner) return { created: false as const };

  const ownerEmail = bootstrapEmail(emailHint);
  const { password, generated } = bootstrapPassword();
  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOOTSTRAP_LOCK_KEY});`;

    const owner = await tx.user.findFirst({
      where: { role: Role.OWNER },
      select: { id: true, email: true },
    });
    if (owner) return { created: false as const };

    const community = await ensureDefaultCommunity(tx);
    await ensureSystemRoles(tx, community.id);

    const user = await tx.user.create({
      data: {
        email: ownerEmail,
        name: "Owner",
        passwordHash,
        role: Role.OWNER,
        forceChangePassword: true,
      },
      select: { id: true, email: true },
    });

    const ownerRoleId = await tx.communityRole.findFirst({
      where: { communityId: community.id, name: Role.OWNER, isSystemDefault: true },
      select: { id: true },
    });
    if (!ownerRoleId) {
      throw new Error("Bootstrap failed: system OWNER role missing.");
    }

    await tx.communityMembership.create({
      data: { communityId: community.id, userId: user.id, roleId: ownerRoleId.id },
      select: { id: true },
    });

    return {
      created: true as const,
      userId: user.id,
      email: user.email,
      communityId: community.id,
      password: generated ? password : null,
    };
  });

  if (result.created) {
    await createAuditLog({
      userId: result.userId,
      communityId: result.communityId,
      eventType: "auth.bootstrap_owner_created",
      metadata: {
        email: result.email,
        generatedPassword: Boolean(result.password),
      } as unknown as Prisma.InputJsonValue,
    });

    if (generated && result.password) {
      console.warn(
        "[bootstrap] OWNER_BOOTSTRAP_PASSWORD not set. Generated a one-time owner password.",
      );
      console.warn(`[bootstrap] Owner email: ${result.email}`);
      console.warn(`[bootstrap] One-time password: ${result.password}`);
      console.warn("[bootstrap] You will be forced to change this password after signing in.");
    } else {
      console.warn(`[bootstrap] Bootstrapped owner account: ${result.email}`);
      console.warn("[bootstrap] You will be forced to change your password after signing in.");
    }
  }

  return result;
}
