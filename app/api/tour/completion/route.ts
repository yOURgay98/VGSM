import { NextResponse } from "next/server";
import { z } from "zod";

import { AppError, toPublicError } from "@/lib/errors";
import { requireSessionUser } from "@/lib/services/auth";
import { requireActiveCommunityId } from "@/lib/services/community";
import { getWelcomeTourCompletion, setWelcomeTourCompletion } from "@/lib/services/tour";

const updateSchema = z.object({
  completed: z.coerce.boolean(),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const communityId = await requireActiveCommunityId(user.id);
    const state = await getWelcomeTourCompletion({ communityId, userId: user.id });
    return NextResponse.json({ ok: true, state });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to load tour status.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const communityId = await requireActiveCommunityId(user.id);
    const payload = await request.json();
    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_input",
        message: parsed.error.issues[0]?.message ?? "Invalid payload.",
      });
    }

    await setWelcomeTourCompletion({
      communityId,
      userId: user.id,
      completed: parsed.data.completed,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const normalized = toPublicError(error, "Failed to save tour status.");
    return NextResponse.json(
      { ok: false, error: { code: normalized.code, message: normalized.message } },
      { status: normalized.status },
    );
  }
}
