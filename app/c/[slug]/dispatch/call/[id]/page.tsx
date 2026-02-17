import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { assertMembershipForUser } from "@/lib/services/community";
import { requireSessionUser } from "@/lib/services/auth";
import { getCurrentSessionToken } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function DeepLinkDispatchCallPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const path = `/c/${encodeURIComponent(slug)}/dispatch/call/${encodeURIComponent(id)}`;

  let userId: string;
  try {
    const user = await requireSessionUser();
    userId = user.id;
  } catch {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const token = await getCurrentSessionToken();
  if (!token) {
    redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  }

  const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });
  if (!community) notFound();

  try {
    await assertMembershipForUser({ userId, communityId: community.id });
  } catch {
    notFound();
  }

  await prisma.session.updateMany({
    where: { sessionToken: token, userId },
    data: { activeCommunityId: community.id },
  });

  await createAuditLog({
    userId,
    communityId: community.id,
    eventType: AuditEvent.COMMUNITY_SWITCHED,
    metadata: { activeCommunityId: community.id, via: "deeplink", slug: community.slug },
  });

  redirect(`/app/dispatch?callId=${encodeURIComponent(id)}`);
}
