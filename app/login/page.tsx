import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";

function initialStateFromError(error: string | undefined) {
  if (!error) return { message: undefined, needsTwoFactor: false };

  const code = error.trim();
  if (code === "2fa_required") {
    return { message: "Two-factor code required.", needsTwoFactor: true };
  }
  if (code === "2fa_invalid") {
    return { message: "Invalid two-factor code or backup code.", needsTwoFactor: true };
  }
  if (code === "rate_limited") {
    return { message: "Too many attempts. Try again in a few minutes.", needsTwoFactor: false };
  }
  if (code === "locked") {
    return { message: "Account temporarily locked. Try again later.", needsTwoFactor: false };
  }
  if (code === "disabled") {
    return { message: "Account disabled. Contact an owner.", needsTwoFactor: false };
  }
  if (code === "service_unavailable") {
    return {
      message:
        "Sign-in service is unavailable. Check DATABASE_URL, NEXTAUTH_SECRET, and NEXTAUTH_URL, then retry.",
      needsTwoFactor: false,
    };
  }

  return { message: "Invalid email, password, or code.", needsTwoFactor: false };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;
  const initial = initialStateFromError(error);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-6">
      <div className="vsm-public-bg pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.75),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(214,220,232,0.55),transparent_40%),linear-gradient(160deg,rgba(245,246,249,0.72)_0%,rgba(236,238,242,0.62)_45%,rgba(225,230,238,0.72)_100%)] dark:bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.05),transparent_40%),linear-gradient(160deg,#0f0f12_0%,#141416_55%,#0f0f12_100%)]" />

      <section className="relative w-full max-w-md rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Vanguard Security &amp; Management
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Staff Sign In
        </h1>
        <p className="mt-1 text-sm text-[color:var(--text-muted)]">
          Secure access for moderation staff and administrators.
        </p>

        <div className="mt-4">
          <LoginForm
            callbackUrl={callbackUrl}
            initialMessage={initial.message}
            initialNeedsTwoFactor={initial.needsTwoFactor}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <Link
            className="ui-transition text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]"
            href="/"
          >
            Return to home
          </Link>
          <p className="text-[color:var(--text-muted)]">Need access? Redeem an invite first.</p>
        </div>

        <div className="mt-4 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
          Invite-only access. New staff accounts must redeem an invite link and access key.
        </div>
      </section>
    </main>
  );
}
