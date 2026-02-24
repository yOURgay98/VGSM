import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";
import { MarketingShell } from "@/components/marketing/marketing-shell";

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
    <MarketingShell
      showHeader={false}
      footerVariant="minimal-center"
      className="vsm-docs-surface"
      contentClassName="flex min-h-[calc(100svh-4rem)] items-center justify-center px-0 pb-10 pt-0"
    >
      <section className="relative w-full max-w-md rounded-[var(--radius-window)] border border-white/12 bg-white/[0.05] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
            Vanguard Security &amp; Management
          </p>
          <Link className="ui-transition text-[12px] text-white/56 hover:text-white/84" href="/">
            Back to Home
          </Link>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">Staff Sign In</h1>
        <p className="mt-1 text-sm text-white/62">
          Secure access for moderation staff and administrators.
        </p>

        <div className="mt-4">
          <LoginForm
            callbackUrl={callbackUrl}
            initialMessage={initial.message}
            initialNeedsTwoFactor={initial.needsTwoFactor}
          />
        </div>

        <div className="mt-4 rounded-[var(--radius-panel)] border border-white/12 bg-white/[0.04] p-3 text-xs text-white/56">
          Invite-only access. New staff accounts must redeem an invite link and access key.
        </div>
      </section>
    </MarketingShell>
  );
}
