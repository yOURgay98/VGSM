import { NextResponse } from "next/server";

import { AppError, toPublicError } from "@/lib/errors";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getMapViewState, saveMapViewState } from "@/lib/services/map";
import { mapViewStateUpdateSchema } from "@/lib/validations/map";

function normalizeScope(raw: string | null) {
  const scope = (raw ?? "dispatch").trim();
  if (!/^[a-z0-9:_-]{1,24}$/i.test(scope)) return "dispatch";
  return scope;
}

export async function GET(request: Request) {
  try {
    const user = await requirePermission(Permission.DISPATCH_READ);
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    const state = await getMapViewState({ communityId: user.communityId, userId: user.id, scope });
    return NextResponse.json({
      state: state ?? {
        scope,
        // Static map defaults to centered normalized coordinates.
        centerLat: 0.5,
        centerLng: 0.5,
        zoom: 1,
        enabledLayers: {
          calls: true,
          units: true,
          pois: true,
          zones: true,
          heatmap: false,
          labels: true,
          postalGrid: false,
        },
      },
    });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to load map view state.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requirePermission(Permission.DISPATCH_READ);
    const { searchParams } = new URL(request.url);
    const scope = normalizeScope(searchParams.get("scope"));

    const json = await request.json();
    const parsed = mapViewStateUpdateSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid payload.",
      });
    }

    const state = await saveMapViewState({
      communityId: user.communityId,
      userId: user.id,
      scope,
      patch: parsed.data,
    });

    return NextResponse.json({ ok: true, state });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to save map view state.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
