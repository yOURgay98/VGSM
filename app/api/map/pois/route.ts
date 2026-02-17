import { NextResponse } from "next/server";

import { AppError, toPublicError } from "@/lib/errors";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { createMapPoi, listMapPois } from "@/lib/services/map";
import { mapPoiCreateSchema } from "@/lib/validations/map";

export async function GET(request: Request) {
  try {
    const user = await requirePermission(Permission.DISPATCH_READ);
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const cursor = searchParams.get("cursor");
    const take = searchParams.get("take") ? Number(searchParams.get("take")) : undefined;

    const { items, nextCursor } = await listMapPois({
      communityId: user.communityId,
      category,
      cursor,
      take,
    });

    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to load POIs.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(Permission.MAP_MANAGE_LAYERS);
    const json = await request.json();
    const parsed = mapPoiCreateSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid payload.",
      });
    }

    const poi = await createMapPoi({
      communityId: user.communityId,
      actorUserId: user.id,
      ...parsed.data,
    });

    return NextResponse.json({ ok: true, poi });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to save POI.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
