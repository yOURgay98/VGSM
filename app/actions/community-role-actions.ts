"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/services/auth";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { getSensitiveModeStatus } from "@/lib/services/sensitive-mode";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { getCurrentSessionToken } from "@/lib/services/session";
import { Permission as PermissionConst, type Permission } from "@/lib/security/permissions";
import { OWNER_ONLY_PERMISSIONS } from "@/lib/security/permission-groups";
import { ROLE_PRIORITY } from "@/lib/permissions";

type MutationResult =
  | { ok: true; message: string; roleId?: string }
  | { ok: false; message: string };

function toInt(raw: FormDataEntryValue | null, fallback: number) {
  const value = typeof raw === "string" ? raw.trim() : "";
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parsePermissions(formData: FormData): Permission[] {
  const allowed = new Set(Object.values(PermissionConst));
  const raw = formData.getAll("permissions").map((v) => String(v));
  const deduped: Permission[] = [];
  const seen = new Set<string>();
  for (const p of raw) {
    if (!allowed.has(p as PermissionConst)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    deduped.push(p as Permission);
  }
  return deduped;
}

async function assertHighRiskRoleEditAllowed(input: {
  actorUserId: string;
  communityId: string;
  nextPermissions: readonly Permission[];
}) {
  const dangerous = input.nextPermissions.some((p) => OWNER_ONLY_PERMISSIONS.includes(p));
  if (!dangerous) return;

  const settings = await getSecuritySettings(input.communityId);
  if (!settings.requireSensitiveModeForHighRisk) return;

  const token = await getCurrentSessionToken();
  if (!token) {
    throw new Error("Sensitive mode is required for high-risk role changes.");
  }

  const status = await getSensitiveModeStatus({ userId: input.actorUserId, sessionToken: token });
  if (!status.enabled) {
    throw new Error("Enable Sensitive Mode in the titlebar to modify high-risk permissions.");
  }
}

function assertPermissionEscalationSafe(input: {
  actorPermissions: readonly Permission[];
  nextPermissions: readonly Permission[];
  actorRolePriority: number;
}) {
  const actorPerms = new Set(input.actorPermissions);
  for (const perm of input.nextPermissions) {
    if (!actorPerms.has(perm)) {
      throw new Error(`You cannot grant permission you do not have: ${perm}`);
    }
  }

  const isOwner = input.actorRolePriority >= ROLE_PRIORITY.OWNER;
  if (!isOwner) {
    for (const perm of OWNER_ONLY_PERMISSIONS) {
      if (input.nextPermissions.includes(perm)) {
        throw new Error("Only an OWNER can grant this permission.");
      }
    }
  }
}

function assertRolePrioritySafe(input: {
  actorRolePriority: number;
  targetRolePriority?: number;
  nextRolePriority: number;
  targetRoleName?: string;
}) {
  const actorPriority = input.actorRolePriority;
  const isOwner = actorPriority >= ROLE_PRIORITY.OWNER;

  // Hard-stop editing the OWNER system role unless you're an OWNER.
  if (!isOwner && input.targetRoleName === "OWNER") {
    throw new Error("Only an OWNER can modify the OWNER role.");
  }

  if (
    !isOwner &&
    typeof input.targetRolePriority === "number" &&
    input.targetRolePriority > actorPriority
  ) {
    throw new Error("You cannot modify a role higher than your own.");
  }

  if (!isOwner && input.nextRolePriority > actorPriority) {
    throw new Error("Role priority cannot exceed your own.");
  }
}

export async function createCommunityRoleAction(
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(PermissionConst.USERS_EDIT_ROLE);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = toInt(formData.get("priority"), ROLE_PRIORITY.TRIAL_MOD);
  const permissions = parsePermissions(formData);

  if (name.length < 2 || name.length > 40) {
    return { ok: false, message: "Role name must be 2-40 characters." };
  }

  if (!Number.isFinite(priority) || priority < 1 || priority > ROLE_PRIORITY.OWNER) {
    return { ok: false, message: `Priority must be between 1 and ${ROLE_PRIORITY.OWNER}.` };
  }

  try {
    assertRolePrioritySafe({
      actorRolePriority: actor.membership.role.priority,
      nextRolePriority: priority,
    });
    assertPermissionEscalationSafe({
      actorPermissions: actor.permissions,
      nextPermissions: permissions,
      actorRolePriority: actor.membership.role.priority,
    });
    await assertHighRiskRoleEditAllowed({
      actorUserId: actor.id,
      communityId: actor.communityId,
      nextPermissions: permissions,
    });

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.communityRole.create({
        data: {
          communityId: actor.communityId,
          name,
          description,
          priority,
          isSystemDefault: false,
        },
        select: { id: true },
      });

      if (permissions.length) {
        await tx.communityRolePermission.createMany({
          data: permissions.map((p) => ({ roleId: created.id, permission: p })),
          skipDuplicates: true,
        });
      }

      await createAuditLog(
        {
          communityId: actor.communityId,
          userId: actor.id,
          eventType: AuditEvent.ROLE_CREATED,
          metadata: { roleId: created.id, name, priority, permissions },
        },
        tx,
      );

      return created;
    });

    revalidatePath("/app/settings/roles");
    return { ok: true, message: "Role created.", roleId: role.id };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to create role.",
    };
  }
}

export async function updateCommunityRoleAction(
  roleId: string,
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(PermissionConst.USERS_EDIT_ROLE);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = toInt(formData.get("priority"), ROLE_PRIORITY.TRIAL_MOD);
  const permissions = parsePermissions(formData);

  if (!roleId?.trim()) return { ok: false, message: "Role id missing." };
  if (name.length < 2 || name.length > 40) {
    return { ok: false, message: "Role name must be 2-40 characters." };
  }
  if (!Number.isFinite(priority) || priority < 1 || priority > ROLE_PRIORITY.OWNER) {
    return { ok: false, message: `Priority must be between 1 and ${ROLE_PRIORITY.OWNER}.` };
  }

  try {
    const existing = await prisma.communityRole.findFirst({
      where: { id: roleId, communityId: actor.communityId },
      select: { id: true, name: true, priority: true, isSystemDefault: true },
    });
    if (!existing) {
      return { ok: false, message: "Role not found." };
    }

    assertRolePrioritySafe({
      actorRolePriority: actor.membership.role.priority,
      targetRolePriority: existing.priority,
      nextRolePriority: priority,
      targetRoleName: existing.name,
    });
    assertPermissionEscalationSafe({
      actorPermissions: actor.permissions,
      nextPermissions: permissions,
      actorRolePriority: actor.membership.role.priority,
    });
    await assertHighRiskRoleEditAllowed({
      actorUserId: actor.id,
      communityId: actor.communityId,
      nextPermissions: permissions,
    });

    await prisma.$transaction(async (tx) => {
      await tx.communityRole.updateMany({
        where: { id: roleId, communityId: actor.communityId },
        data: { name, description, priority },
      });

      await tx.communityRolePermission.deleteMany({ where: { roleId } });
      if (permissions.length) {
        await tx.communityRolePermission.createMany({
          data: permissions.map((p) => ({ roleId, permission: p })),
          skipDuplicates: true,
        });
      }

      await createAuditLog(
        {
          communityId: actor.communityId,
          userId: actor.id,
          eventType: AuditEvent.ROLE_UPDATED,
          metadata: { roleId, name, priority, permissions },
        },
        tx,
      );
    });

    revalidatePath("/app/settings/roles");
    return { ok: true, message: "Role updated.", roleId };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update role.",
    };
  }
}

export async function cloneCommunityRoleAction(roleId: string): Promise<MutationResult> {
  const actor = await requirePermission(PermissionConst.USERS_EDIT_ROLE);
  if (!roleId?.trim()) {
    return { ok: false, message: "Role id missing." };
  }

  try {
    const existing = await prisma.communityRole.findFirst({
      where: { id: roleId, communityId: actor.communityId },
      include: { permissions: { select: { permission: true } } },
    });
    if (!existing) {
      return { ok: false, message: "Role not found." };
    }

    const permissions = existing.permissions.map((perm) => perm.permission as Permission);
    assertRolePrioritySafe({
      actorRolePriority: actor.membership.role.priority,
      targetRolePriority: existing.priority,
      nextRolePriority: existing.priority,
      targetRoleName: existing.name,
    });
    assertPermissionEscalationSafe({
      actorPermissions: actor.permissions,
      nextPermissions: permissions,
      actorRolePriority: actor.membership.role.priority,
    });
    await assertHighRiskRoleEditAllowed({
      actorUserId: actor.id,
      communityId: actor.communityId,
      nextPermissions: permissions,
    });

    const cloned = await prisma.$transaction(async (tx) => {
      const baseName = `${existing.name} Copy`;
      let nextName = baseName;
      let suffix = 2;
      while (true) {
        const found = await tx.communityRole.findFirst({
          where: { communityId: actor.communityId, name: nextName },
          select: { id: true },
        });
        if (!found) break;
        nextName = `${baseName} ${suffix}`;
        suffix += 1;
      }

      const role = await tx.communityRole.create({
        data: {
          communityId: actor.communityId,
          name: nextName,
          description: existing.description,
          priority: existing.priority,
          isSystemDefault: false,
        },
        select: { id: true, name: true },
      });

      if (permissions.length > 0) {
        await tx.communityRolePermission.createMany({
          data: permissions.map((permission) => ({ roleId: role.id, permission })),
          skipDuplicates: true,
        });
      }

      await createAuditLog(
        {
          communityId: actor.communityId,
          userId: actor.id,
          eventType: AuditEvent.ROLE_CREATED,
          metadata: {
            roleId: role.id,
            name: role.name,
            clonedFromRoleId: existing.id,
            permissions,
          },
        },
        tx,
      );

      return role;
    });

    revalidatePath("/app/settings/roles");
    return { ok: true, message: "Role cloned.", roleId: cloned.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Failed to clone role." };
  }
}

export async function deleteCommunityRoleAction(roleId: string) {
  const actor = await requirePermission(PermissionConst.USERS_EDIT_ROLE);

  const role = await prisma.communityRole.findFirst({
    where: { id: roleId, communityId: actor.communityId },
    select: {
      id: true,
      name: true,
      isSystemDefault: true,
      _count: { select: { memberships: true } },
    },
  });

  if (!role) {
    throw new Error("Role not found.");
  }
  if (role.isSystemDefault) {
    throw new Error("System roles cannot be deleted.");
  }
  if (role._count.memberships > 0) {
    throw new Error("Move members off this role before deleting it.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.communityRolePermission.deleteMany({ where: { roleId } });
    await tx.communityRole.deleteMany({ where: { id: roleId, communityId: actor.communityId } });

    await createAuditLog(
      {
        communityId: actor.communityId,
        userId: actor.id,
        eventType: AuditEvent.ROLE_DELETED,
        metadata: { roleId, name: role.name },
      },
      tx,
    );
  });

  revalidatePath("/app/settings/roles");
  return { ok: true } as const;
}
