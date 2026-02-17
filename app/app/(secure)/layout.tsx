import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/services/auth";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getCommunityAuthContext, requireActiveCommunityId } from "@/lib/services/community";
import { getSecuritySettings } from "@/lib/services/security-settings";

export const dynamic = "force-dynamic";

export default async function SecureAppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  // If the encryption key isn't configured, we cannot enroll 2FA safely.
  // Avoid bricking the app in local dev; production must set AUTH_ENCRYPTION_KEY.
  if (!process.env.AUTH_ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
      return (
        <div className="m-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-main)] shadow-[var(--panel-shadow)]">
          <p className="text-base font-semibold tracking-tight">Server misconfiguration</p>
          <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">
            <code className="rounded-md border border-[color:var(--border)] bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/[0.06]">
              AUTH_ENCRYPTION_KEY
            </code>{" "}
            must be set in production to enable 2FA and secure secret storage.
          </p>
        </div>
      );
    }
    return children;
  }

  const communityId = await requireActiveCommunityId(user.id);

  const [dbUser, security, ctx] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true, disabledAt: true, forceChangePassword: true },
    }),
    getSecuritySettings(communityId),
    getCommunityAuthContext({ userId: user.id, communityId }),
  ]);

  if (!dbUser) {
    // In auth bypass mode this can happen; allow navigation but most actions will be blocked.
    return children;
  }

  if (dbUser.disabledAt) {
    redirect("/login");
  }

  // In local dev bypass mode, skip the 2FA gate so the app is usable for UI/dev work.
  // Bypass is hard-disabled in production.
  if (!isAuthBypassEnabled()) {
    if (dbUser.forceChangePassword) {
      redirect("/app/profile?tab=security&password=1");
    }

    const privileged = ctx.membership.role.priority >= ROLE_PRIORITY.ADMIN;
    if (security.require2FAForPrivileged && privileged && !dbUser.twoFactorEnabled) {
      redirect("/app/profile?tab=security&enroll=1");
    }
  }

  return children;
}
