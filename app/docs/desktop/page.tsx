import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function DesktopDocsPage() {
  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Desktop
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Build VSM Desktop (Tauri)
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Build and run the desktop wrapper locally. The desktop app reuses VSM web sessions and
            does not store raw passwords.
          </p>
        </header>

        <div className="grid gap-3">
          <DocBlock title="Prerequisites">
            <ul className="grid gap-1 text-[13px] text-white/65">
              <li>1. Node.js + npm installed.</li>
              <li>2. Rust toolchain installed.</li>
              <li>3. Platform prerequisites for Tauri (WebView2 on Windows, etc.).</li>
            </ul>
          </DocBlock>

          <DocBlock title="Run in development">
            <pre className="overflow-auto rounded-[18px] border border-white/10 bg-black/30 p-4 text-[12px] text-white/85">
              {`npm install
npm run dev
cd desktop
npm install
npm run tauri dev`}
            </pre>
          </DocBlock>

          <DocBlock title="Build binaries">
            <pre className="overflow-auto rounded-[18px] border border-white/10 bg-black/30 p-4 text-[12px] text-white/85">
              {`cd desktop
npm run tauri build`}
            </pre>
            <p className="mt-2 text-[13px] text-white/65">
              Copy built artifacts to <code className="text-white/80">public/downloads/</code> to
              activate direct downloads on <code className="text-white/80">/download</code>.
            </p>
          </DocBlock>

          <DocBlock id="verify" title="Verify downloads (SHA256)">
            <p className="text-[13px] leading-relaxed text-white/65">
              If checksums are published with a release, compare the hash locally after download.
            </p>
            <pre className="mt-3 overflow-auto rounded-[18px] border border-white/10 bg-black/30 p-4 text-[12px] text-white/85">
              {`# macOS / Linux
shasum -a 256 <file>

# Windows (PowerShell)
Get-FileHash <file> -Algorithm SHA256`}
            </pre>
            <p className="mt-2 text-[13px] text-white/65">
              Download binaries from <Link href="/download" className="mkt-link">/download</Link>.
            </p>
          </DocBlock>
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
  children: ReactNode;
}) {
  return (
    <div id={id} className="ui-transition rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
      <p className="text-[13px] font-semibold text-white">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
