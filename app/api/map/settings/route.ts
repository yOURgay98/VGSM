import { NextResponse } from "next/server";

import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { getMapSettings, updateMapSettings } from "@/lib/services/map-settings";
import { mapSettingsSchema } from "@/lib/validations/map";

export async function GET() {
  try {
    const user = await requirePermission(Permission.DISPATCH_READ);
    const settings = await getMapSettings(user.communityId);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized" },
      { status: 401 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requirePermission(Permission.SETTINGS_EDIT);
    const json = await request.json().catch(() => null);
    const parsed = mapSettingsSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    await updateMapSettings({
      actorUserId: user.id,
      communityId: user.communityId,
      payload: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message.toLowerCase().includes("permission") ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
