import Link from "next/link";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MarketingBackButton } from "@/components/marketing/marketing-back-button";
import { PublicPageTransition } from "@/components/marketing/public-page-transition";
import { getSessionUser } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV !== "production";
const buildStamp =
  process.env.NEXT_PUBLIC_BUILD_STAMP ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.GITHUB_SHA?.slice(0, 8) ||
  "dev";

export async function MarketingShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    sessionUser = await getSessionUser();
  } catch {
    sessionUser = null;
  }

  return (
    <main className={cn("relative min-h-screen px-4 py-6", className)}>
      <div className="vsm-public-bg pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.78),transparent_44%),radial-gradient(circle_at_92%_-10%,rgba(214,220,232,0.55),transparent_42%),linear-gradient(160deg,rgba(245,246,249,0.72)_0%,rgba(236,238,242,0.62)_45%,rgba(225,230,238,0.72)_100%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.08),transparent_44%),radial-gradient(circle_at_92%_-10%,rgba(255,255,255,0.05),transparent_42%),linear-gradient(160deg,#0f0f12_0%,#141416_55%,#0f0f12_100%)]" />

      <div className="relative mx-auto w-full max-w-[68rem]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <MarketingBackButton />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                Vanguard Security &amp; Management
              </p>
              <p className="text-sm font-semibold tracking-tight text-[color:var(--text-main)]">
                VSM Console
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-[13px]">
            <ThemeToggle />
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/download">Download</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <span
              className="mx-1 hidden h-4 w-px bg-[color:var(--border)] md:inline-block"
              aria-hidden
            />
            <NavLink href={sessionUser ? "/app" : "/login"} accent>
              {sessionUser ? "Open Dashboard" : "Sign in"}
            </NavLink>
          </nav>
        </header>

        <div className="mt-6">
          <PublicPageTransition>{children}</PublicPageTransition>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--border)] pt-4 text-xs text-[color:var(--text-muted)]">
          <p>VSM is invite-only and permission-gated. All actions are audited.</p>
          <div className="flex items-center gap-3">
            {isDev ? (
              <span className="rounded border border-[color:var(--border)] px-1.5 py-0.5">
                build {buildStamp}
              </span>
            ) : null}
            <Link className="ui-transition hover:text-[color:var(--text-main)]" href="/privacy">
              Privacy
            </Link>
            <Link className="ui-transition hover:text-[color:var(--text-main)]" href="/terms">
              Terms
            </Link>
            <Link className="ui-transition hover:text-[color:var(--text-main)]" href="/api/health">
              Status
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function NavLink({
  href,
  children,
  accent,
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "ui-transition rounded-[var(--radius-control)] border px-3 py-1.5 font-medium",
        accent
          ? "border-transparent bg-[var(--accent)] text-white hover:brightness-[1.04]"
          : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]",
      )}
    >
      {children}
    </Link>
  );
}
