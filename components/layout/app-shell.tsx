import { Sidebar } from "@/components/layout/sidebar";
import { TitleBar } from "@/components/layout/titlebar";
import { PageTransition } from "@/components/layout/page-transition";
import { PresencePinger } from "@/components/live/presence-pinger";
import { OverlayProvider } from "@/components/overlay/overlay-provider";
import { DiagnosticsCapture } from "@/components/dev/diagnostics-capture";
import Link from "next/link";

const isDev = process.env.NODE_ENV !== "production";
const buildStamp =
  process.env.NEXT_PUBLIC_BUILD_STAMP ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.GITHUB_SHA?.slice(0, 8) ||
  "dev";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  community: { id: string; name: string; slug: string };
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    roleName: string;
    rolePriority: number;
  }>;
  title: string;
  children: React.ReactNode;
}

export function AppShell({ user, title, community, communities, children }: AppShellProps) {
  return (
    <OverlayProvider>
      <DiagnosticsCapture />
      <div className="ui-transition relative m-2 flex min-h-[calc(100vh-1rem)] overflow-hidden rounded-[var(--radius-window)] border border-[color:var(--border-strong)] bg-[color:var(--window-shell)] shadow-[var(--window-shadow)] backdrop-blur-lg">
        <Sidebar />
          <div className="flex min-h-full flex-1 flex-col">
            <PresencePinger />
            <TitleBar title={title} user={user} community={community} communities={communities} />
            <main className="flex-1 px-3 py-2 lg:px-4 lg:py-3">
              <PageTransition>{children}</PageTransition>
            </main>
          <footer className="flex items-center justify-between border-t border-[color:var(--border)] px-3 py-1.5 text-[11px] text-[color:var(--text-muted)] lg:px-4">
            <p>VSM operational console</p>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="ui-transition hover:text-[color:var(--text-main)]">
                Terms
              </Link>
              <Link href="/privacy" className="ui-transition hover:text-[color:var(--text-main)]">
                Privacy
              </Link>
              <Link
                href="/api/health"
                className="ui-transition hover:text-[color:var(--text-main)]"
              >
                Status
              </Link>
            </div>
          </footer>
        </div>
        {isDev ? (
          <div className="pointer-events-none absolute bottom-2 right-2 rounded border border-[color:var(--border)] bg-[color:var(--surface-strong)]/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[color:var(--text-muted)] backdrop-blur">
            build {buildStamp}
          </div>
        ) : null}
      </div>
    </OverlayProvider>
  );
}
