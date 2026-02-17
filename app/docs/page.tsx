import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function DocsPage() {
  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Docs
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Quick Start</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Launch VSM locally, understand the security model, and keep deployment checklists close
            for production hosting.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <DocBlock title="Run locally">
            <ol className="grid gap-1 text-[13px] text-white/65">
              <li>1. Configure PostgreSQL and set `DATABASE_URL` in `.env`.</li>
              <li>2. `npm install`</li>
              <li>3. `npx prisma migrate dev`</li>
              <li>4. `npm run prisma:seed` (optional demo data)</li>
              <li>5. `npm run dev`</li>
            </ol>
          </DocBlock>

          <DocBlock title="Security posture">
            <ul className="grid gap-1 text-[13px] text-white/65">
              <li>Strict, tenant-scoped RBAC.</li>
              <li>High-risk actions use approvals (two-person rule) when enabled.</li>
              <li>Audit log uses a hash chain to detect tampering.</li>
              <li>2FA (TOTP) supported with backup codes.</li>
            </ul>
            <Link
              href="/docs/security"
              className="mt-2 inline-flex text-[13px] font-semibold text-white/80 hover:text-white hover:underline"
            >
              Full security guide
            </Link>
          </DocBlock>

          <DocBlock title="Dispatch">
            <p className="text-[13px] leading-relaxed text-white/65">
              Calls follow a server-enforced state machine. Each transition writes a DispatchEvent
              and an AuditLog entry.
            </p>
          </DocBlock>

          <DocBlock title="Map">
            <p className="text-[13px] leading-relaxed text-white/65">
              Static tactical map rendering with pan/zoom overlays for calls, POIs, zones, pings,
              labels, and grid tools.
            </p>
          </DocBlock>

          <DocBlock title="Deploy">
            <p className="text-[13px] leading-relaxed text-white/65">
              Production checklist for secrets, migrations, HTTPS, owner bootstrap, and post-deploy
              verification.
            </p>
            <Link
              href="/docs/deploy"
              className="mt-2 inline-flex text-[13px] font-semibold text-white/80 hover:text-white hover:underline"
            >
              Open deployment checklist
            </Link>
          </DocBlock>

          <DocBlock id="shortcuts" title="Keyboard shortcuts">
            <ul className="grid gap-1 text-[13px] text-white/65">
              <li>`Cmd/Ctrl + K` opens the global command bar.</li>
              <li>`Esc` closes dialogs, palette, and focused overlays.</li>
              <li>Use map layer toggles to isolate calls/POIs/zones quickly.</li>
            </ul>
          </DocBlock>
        </div>

        {/* CTAs live in the top nav and the landing hero to avoid repetitive prompts. */}
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
      className="ui-transition rounded-[26px] border border-white/10 bg-white/[0.05] p-5 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
    >
      <p className="text-[13px] font-semibold text-white">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
