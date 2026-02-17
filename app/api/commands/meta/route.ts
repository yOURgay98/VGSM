import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { COMMANDS } from "@/lib/commands/registry";
import { getSessionUser } from "@/lib/services/auth";
import { getCommunityAuthContext, resolveActiveCommunityId } from "@/lib/services/community";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const communityId = await resolveActiveCommunityId(sessionUser.id);
  if (!communityId) {
    return NextResponse.json({ commands: [] });
  }
  const ctx = await getCommunityAuthContext({ userId: sessionUser.id, communityId });

  const toggles = await prisma.commandToggle.findMany({
    where: { communityId },
    select: { id: true, enabled: true },
  });
  const enabledById = new Map(toggles.map((t) => [t.id, t.enabled]));

  const commands = COMMANDS.filter((cmd) => ctx.permissions.includes(cmd.requiredPermission)).map(
    (cmd) => ({
      id: cmd.id,
      name: cmd.name,
      description: cmd.description,
      riskLevel: cmd.riskLevel,
      enabled: enabledById.get(cmd.id) ?? true,
      fields: cmd.fields,
    }),
  );

  return NextResponse.json({ commands });
}
