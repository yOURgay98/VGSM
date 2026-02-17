import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function DocsPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Docs
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Quick Start
        </h1>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DocBlock title="Run locally">
            <ol className="grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              <li>1. Configure PostgreSQL and set `DATABASE_URL` in `.env`.</li>
              <li>2. `npm install`</li>
              <li>3. `npx prisma migrate dev`</li>
              <li>4. `npm run prisma:seed` (optional demo data)</li>
              <li>5. `npm run dev`</li>
            </ol>
          </DocBlock>

          <DocBlock title="Security posture">
            <ul className="grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              <li>Strict, tenant-scoped RBAC.</li>
              <li>High-risk actions use approvals (two-person rule) when enabled.</li>
              <li>Audit log uses a hash chain to detect tampering.</li>
              <li>2FA (TOTP) supported with backup codes.</li>
            </ul>
            <Link
              href="/docs/security"
              className="mt-2 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
            >
              Full security guide
            </Link>
          </DocBlock>

          <DocBlock title="Dispatch">
            <p className="text-[13px] leading-relaxed text-[color:var(--text-muted)]">
              Calls follow a server-enforced state machine. Each transition writes a DispatchEvent
              and an AuditLog entry.
            </p>
          </DocBlock>

          <DocBlock title="Map">
            <p className="text-[13px] leading-relaxed text-[color:var(--text-muted)]">
              Static tactical map image rendering with pan/zoom overlays for calls, units, POIs,
              zones, pings, labels, and postal grid.
            </p>
          </DocBlock>

          <DocBlock title="Deploy">
            <p className="text-[13px] leading-relaxed text-[color:var(--text-muted)]">
              Production checklist for secrets, migrations, HTTPS, owner bootstrap, and post-deploy
              verification.
            </p>
            <Link
              href="/docs/deploy"
              className="mt-2 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
            >
              Open deployment checklist
            </Link>
          </DocBlock>

          <DocBlock id="shortcuts" title="Keyboard shortcuts">
            <ul className="grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              <li>`Cmd/Ctrl + K` opens the global command bar.</li>
              <li>`Esc` closes dialogs, palette, and focused overlays.</li>
              <li>Use map layer toggles to isolate calls/units/POIs/zones quickly.</li>
            </ul>
          </DocBlock>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/app"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
          >
            Open Web App
          </Link>
          <Link
            href="/features"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            View Features
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

function DocBlock({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_12%,var(--border))]"
    >
      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
