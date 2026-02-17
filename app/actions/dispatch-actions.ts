"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { toPublicError } from "@/lib/errors";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import {
  assignDispatchUnitSchema,
  createDispatchCallSchema,
  createDispatchUnitSchema,
  transitionDispatchCallStatusSchema,
  updateDispatchUnitStatusSchema,
} from "@/lib/validations/dispatch";
import {
  assignDispatchUnitToCall,
  createDispatchCall,
  createDispatchUnit,
  transitionDispatchCallStatus,
  unassignDispatchUnit,
  updateDispatchUnitStatus,
} from "@/lib/services/dispatch";

type MutationErrorCode = "invalid_input" | "forbidden" | "tenant_missing" | "db_error" | "unknown";
type MutationResult = { success: boolean; message: string; id?: string; code?: MutationErrorCode };

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null,
    userAgent: h.get("user-agent") ?? null,
  };
}

export async function createDispatchCallAction(
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  let actor: Awaited<ReturnType<typeof requirePermission>>;
  let meta: Awaited<ReturnType<typeof requestMeta>>;
  try {
    actor = await requirePermission(Permission.DISPATCH_MANAGE);
    meta = await requestMeta();
  } catch (error) {
    return {
      success: false,
      code: "forbidden",
      message: error instanceof Error ? error.message : "Forbidden.",
    };
  }

  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const priority = formData.get("priority");
  const locationName = String(formData.get("locationName") ?? "").trim() || null;
  const latRaw = String(formData.get("lat") ?? "").trim();
  const lngRaw = String(formData.get("lng") ?? "").trim();
  const mapXRaw = String(formData.get("mapX") ?? "").trim();
  const mapYRaw = String(formData.get("mapY") ?? "").trim();
  const lat = latRaw.length ? Number(latRaw) : null;
  const lng = lngRaw.length ? Number(lngRaw) : null;
  const mapX = mapXRaw.length ? Number(mapXRaw) : null;
  const mapY = mapYRaw.length ? Number(mapYRaw) : null;

  const parsed = createDispatchCallSchema.safeParse({
    title,
    description,
    priority,
    locationName,
    lat,
    lng,
    mapX,
    mapY,
  });

  if (!parsed.success) {
    return {
      success: false,
      code: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "Invalid call payload.",
    };
  }

  try {
    if (!actor.communityId?.trim()) {
      return { success: false, code: "tenant_missing", message: "No active community selected." };
    }

    const call = await createDispatchCall({
      communityId: actor.communityId,
      actorUserId: actor.id,
      ...parsed.data,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    revalidatePath("/app/dispatch");
    revalidatePath("/app/control");
    revalidatePath("/app/dashboard");

    return { success: true, message: "Call created.", id: call.id };
  } catch (error) {
    const normalized = toPublicError(error, "Failed to create call.");
    const code: MutationErrorCode =
      normalized.code === "invalid_input" ||
      normalized.code === "forbidden" ||
      normalized.code === "tenant_missing" ||
      normalized.code === "db_error"
        ? normalized.code
        : "unknown";
    return { success: false, code, message: normalized.message };
  }
}

export async function transitionDispatchCallStatusAction(
  callId: string,
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  let actor: Awaited<ReturnType<typeof requirePermission>>;
  let meta: Awaited<ReturnType<typeof requestMeta>>;
  try {
    actor = await requirePermission(Permission.DISPATCH_MANAGE);
    meta = await requestMeta();
  } catch (error) {
    const normalized = toPublicError(error, "Forbidden.");
    const code: MutationErrorCode =
      normalized.code === "forbidden" || normalized.code === "tenant_missing"
        ? normalized.code
        : "forbidden";
    return { success: false, code, message: normalized.message };
  }

  const parsed = transitionDispatchCallStatusSchema.safeParse({
    callId,
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return {
      success: false,
      code: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "Invalid status payload.",
    };
  }

  try {
    await transitionDispatchCallStatus({
      communityId: actor.communityId,
      actorUserId: actor.id,
      actorRolePriority: actor.membership.role.priority,
      callId: parsed.data.callId,
      nextStatus: parsed.data.nextStatus,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to update call status.");
    const code: MutationErrorCode =
      normalized.code === "invalid_input" ||
      normalized.code === "forbidden" ||
      normalized.code === "tenant_missing" ||
      normalized.code === "db_error"
        ? normalized.code
        : "unknown";
    return { success: false, code, message: normalized.message };
  }

  revalidatePath("/app/dispatch");
  revalidatePath("/app/control");

  return { success: true, message: "Status updated." };
}

export async function createDispatchUnitAction(
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.DISPATCH_MANAGE);
  const meta = await requestMeta();

  const parsed = createDispatchUnitSchema.safeParse({
    callSign: formData.get("callSign"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid unit payload." };
  }

  const unit = await createDispatchUnit({
    communityId: actor.communityId,
    actorUserId: actor.id,
    ...parsed.data,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/app/dispatch");
  revalidatePath("/app/dispatch/units");
  revalidatePath("/app/control");

  return { success: true, message: "Unit created.", id: unit.id };
}

export async function updateDispatchUnitStatusAction(
  unitId: string,
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.DISPATCH_MANAGE);
  const meta = await requestMeta();

  const parsed = updateDispatchUnitStatusSchema.safeParse({
    unitId,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid unit status payload.",
    };
  }

  await updateDispatchUnitStatus({
    communityId: actor.communityId,
    actorUserId: actor.id,
    unitId: parsed.data.unitId,
    status: parsed.data.status,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/app/dispatch");
  revalidatePath("/app/dispatch/units");
  revalidatePath("/app/control");

  return { success: true, message: "Unit updated." };
}

export async function assignDispatchUnitToCallAction(
  _prev: MutationResult,
  formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.DISPATCH_MANAGE);
  const meta = await requestMeta();

  const parsed = assignDispatchUnitSchema.safeParse({
    callId: formData.get("callId"),
    unitId: formData.get("unitId"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid assignment payload.",
    };
  }

  await assignDispatchUnitToCall({
    communityId: actor.communityId,
    actorUserId: actor.id,
    actorRolePriority: actor.membership.role.priority,
    callId: parsed.data.callId,
    unitId: parsed.data.unitId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/app/dispatch");
  revalidatePath("/app/dispatch/units");
  revalidatePath("/app/control");

  return { success: true, message: "Unit assigned." };
}

export async function unassignDispatchUnitAction(
  unitId: string,
  _prev: MutationResult,
  _formData: FormData,
): Promise<MutationResult> {
  const actor = await requirePermission(Permission.DISPATCH_MANAGE);
  const meta = await requestMeta();

  if (!unitId?.trim()) return { success: false, message: "Unit id missing." };

  await unassignDispatchUnit({
    communityId: actor.communityId,
    actorUserId: actor.id,
    unitId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/app/dispatch");
  revalidatePath("/app/dispatch/units");
  revalidatePath("/app/control");

  return { success: true, message: "Unit unassigned." };
}
