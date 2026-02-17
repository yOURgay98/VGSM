import Link from "next/link";

import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PublicPageTransition } from "@/components/marketing/public-page-transition";
import { getSessionUser } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV !== "production";
const buildStamp =
  process.env.NEXT_PUBLIC_BUILD_STAMP ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.GITHUB_SHA?.slice(0, 8) ||
  "dev";

const SUPPORT_EMAIL = "johnnywoodswork@gmail.com";

export async function MarketingShell({
  children,
  className,
  sessionUser: providedSessionUser,
}: {
  children: React.ReactNode;
  className?: string;
  sessionUser?: Awaited<ReturnType<typeof getSessionUser>> | null;
}) {
  let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = providedSessionUser ?? null;
  if (providedSessionUser === undefined) {
    try {
      sessionUser = await getSessionUser();
    } catch {
      sessionUser = null;
    }
  }

  return (
    <main
      data-theme="dark"
      data-accent="graphite"
      className={cn("vsm-marketing relative min-h-screen text-white", className)}
    >
      <div className="vsm-marketing-bg pointer-events-none absolute inset-0" />

      <MarketingHeader isAuthed={Boolean(sessionUser)} />

      <div className="relative mx-auto w-full max-w-[78rem] px-5 pb-16 pt-10">
        <PublicPageTransition>{children}</PublicPageTransition>

        <footer className="mt-20 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60">
          <p className="max-w-[34rem]">
            Vanguard Security &amp; Management is permission-gated. Sensitive actions are
            validated server-side and audited for accountability.
            <span className="mx-2 text-white/30" aria-hidden>
              •
            </span>
            <a className="ui-transition text-white/70 hover:text-white" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {isDev ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-white/70">
                build {buildStamp}
              </span>
            ) : null}
            <Link className="ui-transition hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="ui-transition hover:text-white" href="/terms">
              Terms
            </Link>
            <Link className="ui-transition hover:text-white" href="/credits">
              Credits
            </Link>
            <Link className="ui-transition hover:text-white" href="/api/health">
              Status
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
