import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function DesktopDocsPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Desktop Docs
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Build VSM Desktop (Tauri)
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[color:var(--text-muted)]">
          Use this guide to build and run the desktop wrapper locally. The desktop app reuses VSM
          web sessions and does not store raw passwords.
        </p>

        <div className="mt-4 grid gap-3">
          <DocBlock title="Prerequisites">
            <ul className="grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              <li>1. Node.js + npm installed.</li>
              <li>2. Rust toolchain installed.</li>
              <li>3. Platform prerequisites for Tauri (WebView2 on Windows, etc.).</li>
            </ul>
          </DocBlock>

          <DocBlock title="Run in development">
            <pre className="overflow-auto rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-[12px] text-[color:var(--text-main)]">
              {`npm install
npm run dev
cd desktop
npm install
npm run tauri dev`}
            </pre>
          </DocBlock>

          <DocBlock title="Build binaries">
            <pre className="overflow-auto rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-[12px] text-[color:var(--text-main)]">
              {`cd desktop
npm run tauri build`}
            </pre>
            <p className="mt-2 text-[13px] text-[color:var(--text-muted)]">
              Copy built artifacts to `public/downloads/` to activate direct downloads on
              `/download`.
            </p>
          </DocBlock>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/download"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
          >
            Back to Download
          </Link>
          <Link
            href="/app"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Open Web App
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}

function DocBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
