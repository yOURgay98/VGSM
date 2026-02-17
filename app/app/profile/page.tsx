import { MacWindow } from "@/components/layout/mac-window";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { formatRole, roleVariant } from "@/lib/presenters";
import { getSessionUser } from "@/lib/services/auth";
import { getUserByEmail, getUserById } from "@/lib/services/user";
import { listAuditLogs } from "@/lib/services/audit-viewer";
import { getCommunityAuthContext, requireActiveCommunityId } from "@/lib/services/community";
import { getCurrentSessionToken, listUserSessions } from "@/lib/services/session";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { ROLE_PRIORITY } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; enroll?: string; password?: string }>;
}) {
  const sessionUser = await getSessionUser();
  const { tab } = await searchParams;

  if (!sessionUser) {
    return (
      <div className="space-y-2">
        <MacWindow title="Profile" subtitle="Personal account security and session settings">
          <p className="text-sm text-[color:var(--text-muted)]">You are not signed in.</p>
        </MacWindow>
      </div>
    );
  }

  const user = (await getUserById(sessionUser.id)) ?? (await getUserByEmail(sessionUser.email));
  const isBypass = isAuthBypassEnabled();
  const notice =
    !user && isBypass
      ? "Auth bypass mode is enabled. A matching database user was not found, so profile actions are disabled."
      : !user
        ? "We couldn't load your profile record. Some actions may be unavailable."
        : null;

  const communityId = await requireActiveCommunityId(sessionUser.id);

  const [ctx, security, { logs: activityLogs }, currentSessionToken, sessions] = await Promise.all([
    getCommunityAuthContext({ userId: sessionUser.id, communityId }),
    getSecuritySettings(communityId),
    user
      ? listAuditLogs({ communityId, filter: { userId: user.id } })
      : Promise.resolve({ logs: [], integrity: { ok: true, partial: true } }),
    getCurrentSessionToken(),
    user ? listUserSessions(user.id) : Promise.resolve([]),
  ]);

  const privileged = ctx.membership.role.priority >= ROLE_PRIORITY.ADMIN;
  const requirePasswordChange = Boolean(user?.forceChangePassword);
  const requireTwoFactorEnrollment =
    security.require2FAForPrivileged && privileged && !Boolean(user?.twoFactorEnabled);

  const securityRequirements: Array<{
    id: "password" | "2fa";
    title: string;
    description: string;
  }> = [];
  if (requirePasswordChange) {
    securityRequirements.push({
      id: "password",
      title: "Change your password",
      description: "Required before accessing secured pages.",
    });
  }
  if (requireTwoFactorEnrollment) {
    securityRequirements.push({
      id: "2fa",
      title: "Enable two-factor authentication (2FA)",
      description: "Required for privileged roles on this community.",
    });
  }

  const initialTab =
    tab === "security" || tab === "activity"
      ? tab
      : securityRequirements.length
        ? "security"
        : "account";

  const primaryIp =
    (currentSessionToken
      ? sessions.find((s) => s.sessionToken === currentSessionToken)?.ip
      : null) ??
    sessions[0]?.ip ??
    null;

  return (
    <div className="space-y-2">
      <MacWindow title="Profile" subtitle="Account details, security controls, and activity">
        <ProfileTabs
          initialTab={initialTab}
          notice={notice}
          securityRequirements={securityRequirements}
          user={{
            id: user?.id,
            name: user?.name ?? sessionUser.name,
            email: user?.email ?? sessionUser.email,
            roleLabel: formatRole(user?.role ?? sessionUser.role),
            roleVariant: roleVariant(user?.role ?? sessionUser.role),
            disabled: Boolean(user?.disabledAt),
            twoFactorEnabled: Boolean(user?.twoFactorEnabled),
            createdAtLabel: user?.createdAt ? formatDateTime(user.createdAt) : "-",
            lastLoginAtLabel: user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : "-",
            lockedUntilLabel: user?.lockedUntil ? formatDateTime(user.lockedUntil) : null,
          }}
          activity={activityLogs.slice(0, 40).map((log) => ({
            id: log.id,
            createdAtLabel: formatDateTime(log.createdAt),
            eventType: log.eventType,
            metadata: log.metadataJson ? JSON.stringify(log.metadataJson) : null,
          }))}
          sessions={sessions.map((s) => ({
            sessionToken: s.sessionToken,
            current: currentSessionToken ? s.sessionToken === currentSessionToken : false,
            createdAtLabel: formatDateTime(s.createdAt),
            lastActiveAtLabel: formatDateTime(s.lastActiveAt),
            expiresAtLabel: formatDateTime(s.expires),
            ip: s.ip ?? null,
            userAgent: s.userAgent ?? null,
            unusualIp: Boolean(s.ip && primaryIp && s.ip !== primaryIp),
          }))}
          actionsEnabled={Boolean(user)}
        />
      </MacWindow>
    </div>
  );
}
