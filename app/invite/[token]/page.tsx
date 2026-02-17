import Link from "next/link";

import { RedeemInviteForm } from "@/components/forms/redeem-invite-form";
import { RedeemInviteJoinForm } from "@/components/forms/redeem-invite-join-form";
import { prisma } from "@/lib/db";
import { getInviteDetailsByToken } from "@/lib/services/invite";
import { getSessionUser } from "@/lib/services/auth";
import { getSecuritySettings } from "@/lib/services/security-settings";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InviteRedeemPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInviteDetailsByToken(token);
  const sessionUser = await getSessionUser();
  const sessionDbUser = sessionUser
    ? await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { id: true } })
    : null;

  const now = new Date();
  const revoked = Boolean(invite?.revokedAt);
  const expired = Boolean(invite?.expiresAt && invite.expiresAt < now);
  const exhausted = Boolean(invite && invite.uses >= invite.maxUses);
  const invalidReason = !invite
    ? "not_found"
    : revoked
      ? "revoked"
      : expired
        ? "expired"
        : exhausted
          ? "exhausted"
          : null;
  const security = invite ? await getSecuritySettings(invite.communityId) : null;
  const requireBetaKey = Boolean(security?.betaAccessEnabled);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-6">
      <div className="vsm-public-bg pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.75),transparent_38%),radial-gradient(circle_at_15%_90%,rgba(214,220,232,0.55),transparent_42%),linear-gradient(160deg,rgba(245,246,249,0.72)_0%,rgba(236,238,242,0.62)_45%,rgba(225,230,238,0.72)_100%)] dark:bg-[radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.08),transparent_38%),radial-gradient(circle_at_15%_90%,rgba(255,255,255,0.05),transparent_42%),linear-gradient(160deg,#0f0f12_0%,#141416_55%,#0f0f12_100%)]" />

      <section className="relative w-full max-w-md rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          VSM Invite
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Redeem Invite
        </h1>

        {invalidReason ? (
          <div className="mt-4 rounded-[var(--radius-panel)] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
            <p className="font-medium">This invite is not valid.</p>
            <p className="mt-1">
              {invalidReason === "not_found"
                ? "The token could not be found. Make sure you copied the full invite link (not the preview token)."
                : invalidReason === "revoked"
                  ? "This invite was revoked by staff."
                  : invalidReason === "expired"
                    ? "This invite has expired."
                    : "This invite has already been used up."}
            </p>
            <p className="mt-2 text-xs text-rose-700/80 dark:text-rose-300/80">
              Tip: the token preview shown in the Invites table cannot be redeemed. If you lost the
              original invite link, create a new invite.
            </p>
            <Link href="/login" className="mt-3 inline-block text-[var(--accent)] hover:underline">
              Return to login
            </Link>
          </div>
        ) : invite ? (
          <>
            <div className="mt-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
              <p>Community: {invite.community.name}</p>
              <p>Assigned role: {invite.role?.name ?? invite.template?.name ?? "Member"}</p>
              <p>Remaining uses: {invite.maxUses - invite.uses}</p>
              <p>Expires: {invite.expiresAt ? formatDateTime(invite.expiresAt) : "Never"}</p>
              {invite.require2fa || invite.template?.require2fa ? (
                <p className="mt-1 text-[color:var(--text-main)]">2FA required for this invite.</p>
              ) : null}
              {invite.requireApproval || invite.template?.requireApproval ? (
                <p className="mt-1 text-[color:var(--text-main)]">
                  Approval required before access.
                </p>
              ) : null}
            </div>

            <div className="mt-4">
              {sessionUser && sessionDbUser ? (
                <>
                  <div className="mb-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
                    <p>
                      Signed in as{" "}
                      <span className="font-medium text-[color:var(--text-main)]">
                        {sessionUser.email}
                      </span>
                    </p>
                    <p className="mt-1">
                      This will add membership to your existing account and start the beta tour.
                    </p>
                  </div>
                  <RedeemInviteJoinForm
                    token={token}
                    requireBetaKey={requireBetaKey}
                    redirectTo="/app/dashboard"
                  />
                </>
              ) : (
                <RedeemInviteForm token={token} requireBetaKey={requireBetaKey} />
              )}
            </div>

            <p className="mt-4 text-xs text-[color:var(--text-muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                Sign in
              </Link>
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
