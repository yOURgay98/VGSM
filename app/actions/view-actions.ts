"use server";

import { SavedViewScope } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/services/auth";
import { deleteView, saveView } from "@/lib/services/views";
import { Permission } from "@/lib/security/permissions";

const filterSchema = z
  .record(z.string(), z.string())
  .refine((value) => Object.keys(value).length <= 64, "Too many filters.");

const scopeSchema = z.nativeEnum(SavedViewScope);

const viewNameSchema = z
  .string()
  .trim()
  .min(1, "View name is required.")
  .max(48, "View name is too long.");

function revalidateScope(scope: SavedViewScope) {
  if (scope === "PLAYERS") revalidatePath("/app/players");
  if (scope === "CASES") revalidatePath("/app/cases");
  if (scope === "REPORTS") revalidatePath("/app/reports");
  if (scope === "INBOX") revalidatePath("/app/inbox");
}

export async function saveViewAction(scope: unknown, name: unknown, filters: unknown) {
  const user = await requirePermission(Permission.VIEWS_MANAGE);

  const parsedScope = scopeSchema.safeParse(scope);
  if (!parsedScope.success) throw new Error("Invalid scope.");

  const parsedName = viewNameSchema.safeParse(name);
  if (!parsedName.success)
    throw new Error(parsedName.error.issues[0]?.message ?? "Invalid view name.");

  const parsedFilters = filterSchema.safeParse(filters);
  if (!parsedFilters.success) throw new Error("Invalid view filters.");

  await saveView({
    communityId: user.communityId,
    userId: user.id,
    scope: parsedScope.data,
    name: parsedName.data,
    filters: parsedFilters.data,
  });

  revalidateScope(parsedScope.data);
  return { ok: true } as const;
}

export async function deleteViewAction(scope: unknown, viewId: unknown) {
  const user = await requirePermission(Permission.VIEWS_MANAGE);

  const parsedScope = scopeSchema.safeParse(scope);
  if (!parsedScope.success) throw new Error("Invalid scope.");

  const id = z.string().cuid().safeParse(viewId);
  if (!id.success) throw new Error("Invalid view id.");

  await deleteView({ communityId: user.communityId, userId: user.id, viewId: id.data });

  revalidateScope(parsedScope.data);
  return { ok: true } as const;
}
