import Link from "next/link";
import { redirect } from "next/navigation";

import { RedeemInviteJoinForm } from "@/components/forms/redeem-invite-join-form";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/services/auth";
import { getInviteDetailsByToken } from "@/lib/services/invite";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { getCurrentSessionToken } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export default async function WelcomeTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteDetailsByToken(token);

  if (!invite || invite.revokedAt || (invite.expiresAt && invite.expiresAt < new Date())) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8">
        <div className="w-full max-w-lg rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 text-center shadow-[var(--panel-shadow)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Vanguard Security &amp; Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
            Invite Link Invalid
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            This beta link is unavailable. Request a fresh invite from your VSM owner.
          </p>
          <Link
            href="/"
            className="ui-transition mt-4 inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] px-4 text-[13px] font-medium text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const user = await getSessionUser();
  if (!user) {
    const callbackUrl = `/welcome/${encodeURIComponent(token)}`;
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8">
        <div className="w-full max-w-lg rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
            Vanguard Security &amp; Management
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
            Welcome Link Ready
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)]">
            Sign in or create an account to continue. The guided beta tour starts automatically
            after invite validation.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
            >
              Sign in
            </Link>
            <Link
              href={`/invite/${encodeURIComponent(token)}`}
              className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const membership = await prisma.communityMembership.findUnique({
    where: {
      communityId_userId: {
        communityId: invite.communityId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (membership) {
    const sessionToken = await getCurrentSessionToken();
    if (sessionToken) {
      await prisma.session.updateMany({
        where: { sessionToken, userId: user.id },
        data: { activeCommunityId: invite.communityId },
      });
    }
    redirect("/app/dashboard?tour=welcome");
  }

  const security = await getSecuritySettings(invite.communityId);
  const requireBetaKey = Boolean(security.betaAccessEnabled);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-lg rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Vanguard Security &amp; Management
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Join {invite.community.name}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">
          You are signed in as{" "}
          <span className="font-medium text-[color:var(--text-main)]">{user.email}</span>. Redeem
          this invite to start the beta welcome tour.
        </p>

        <div className="mt-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)] shadow-[var(--panel-shadow)]">
          <p>Role: {invite.role?.name ?? invite.template?.name ?? "Member"}</p>
          <p>Remaining uses: {Math.max(0, invite.maxUses - invite.uses)}</p>
          <p>Expires: {invite.expiresAt ? formatDateTime(invite.expiresAt) : "Never"}</p>
          {invite.require2fa || invite.template?.require2fa ? (
            <p className="mt-1">2FA required by invite policy.</p>
          ) : null}
          {invite.requireApproval || invite.template?.requireApproval ? (
            <p className="mt-1">Approval required before access.</p>
          ) : null}
        </div>

        <div className="mt-4">
          <RedeemInviteJoinForm
            token={token}
            requireBetaKey={requireBetaKey}
            redirectTo="/app/dashboard?tour=welcome"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--text-muted)]">
          <Link className="ui-transition hover:text-[color:var(--text-main)]" href="/app/dashboard">
            Skip and open dashboard
          </Link>
          <Link
            className="ui-transition hover:text-[color:var(--text-main)]"
            href={`/invite/${encodeURIComponent(token)}`}
          >
            Open standard invite page
          </Link>
        </div>
      </section>
    </main>
  );
}
