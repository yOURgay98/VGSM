import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getGeneralSettings } from "@/lib/services/settings";
import { getSessionUser } from "@/lib/services/auth";
import { prisma } from "@/lib/db";
import { touchCurrentSession } from "@/lib/services/session";
import { listCommunitiesForUser, requireActiveCommunityId } from "@/lib/services/community";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const communities = await listCommunitiesForUser(user.id);
  if (communities.length === 0) {
    redirect("/onboarding");
  }

  const communityId = await requireActiveCommunityId(user.id);

  const [settings, dbUser] = await Promise.all([
    getGeneralSettings(communityId),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, disabledAt: true },
    }),
  ]);

  const active = communities.find((c) => c.id === communityId) ?? communities[0]!;

  if (!dbUser) {
    // In bypass mode this can happen; allow rendering but most actions will be blocked.
  } else {
    if (dbUser.disabledAt) {
      redirect("/login");
    }

    // Update lastActiveAt/ip/userAgent opportunistically.
    await touchCurrentSession(user.id);

    // 2FA enforcement is applied at the page level so /app/profile can still load for enrollment.
  }

  return (
    <AppShell
      title={settings.communityName}
      community={{ id: active.id, name: active.name, slug: active.slug }}
      communities={communities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        roleName: c.role.name,
        rolePriority: c.role.priority,
      }))}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: active.role.name,
      }}
    >
      {children}
    </AppShell>
  );
}
