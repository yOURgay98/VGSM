import { redirect } from "next/navigation";

import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/services/auth";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { getCommunityAuthContext, requireActiveCommunityId } from "@/lib/services/community";
import { getSecuritySettings } from "@/lib/services/security-settings";

export const dynamic = "force-dynamic";

export default async function OverlayLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // If the encryption key isn't configured, we cannot enroll 2FA safely.
  // Avoid bricking the app in local dev; production must set AUTH_ENCRYPTION_KEY.
  if (!process.env.AUTH_ENCRYPTION_KEY) {
    return children;
  }

  const communityId = await requireActiveCommunityId(user.id);

  const [dbUser, security, ctx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, disabledAt: true },
    }),
    getSecuritySettings(communityId),
    getCommunityAuthContext({ userId: user.id, communityId }),
  ]);

  if (dbUser?.disabledAt) {
    redirect("/login");
  }

  // In local dev bypass mode, skip the 2FA gate so the overlay is usable for UI/dev work.
  // Bypass is hard-disabled in production.
  if (!isAuthBypassEnabled()) {
    const privileged = ctx.membership.role.priority >= ROLE_PRIORITY.ADMIN;
    if (security.require2FAForPrivileged && privileged && !dbUser?.twoFactorEnabled) {
      redirect("/app/profile?tab=security&enroll=1");
    }
  }

  return children;
}
