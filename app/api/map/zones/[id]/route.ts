import { NextResponse } from "next/server";

import { AppError, toPublicError } from "@/lib/errors";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { hideMapZone, updateMapZone } from "@/lib/services/map";
import { mapZoneUpdateSchema } from "@/lib/validations/map";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission(Permission.MAP_MANAGE_LAYERS);
    const { id } = await context.params;
    const json = await request.json();

    const parsed = mapZoneUpdateSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid payload.",
      });
    }

    const zone = await updateMapZone({
      communityId: user.communityId,
      actorUserId: user.id,
      zoneId: id,
      patch: parsed.data,
    });

    return NextResponse.json({ ok: true, zone });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to update zone.");
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

    await hideMapZone({
      communityId: user.communityId,
      actorUserId: user.id,
      zoneId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to hide zone.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
