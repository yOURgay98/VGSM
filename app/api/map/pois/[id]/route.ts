import { NextResponse } from "next/server";

import { AppError, toPublicError } from "@/lib/errors";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { hideMapPoi, updateMapPoi } from "@/lib/services/map";
import { mapPoiUpdateSchema } from "@/lib/validations/map";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(Permission.MAP_MANAGE_LAYERS);
    const { id } = await context.params;
    const json = await request.json();

    const parsed = mapPoiUpdateSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid payload.",
      });
    }

    const poi = await updateMapPoi({
      communityId: user.communityId,
      actorUserId: user.id,
      poiId: id,
      patch: parsed.data,
    });

    return NextResponse.json({ ok: true, poi });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to update POI.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(Permission.MAP_MANAGE_LAYERS);
    const { id } = await context.params;

    await hideMapPoi({
      communityId: user.communityId,
      actorUserId: user.id,
      poiId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to hide POI.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
