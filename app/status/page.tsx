import Link from "next/link";

import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const dynamic = "force-dynamic";

async function readHealth() {
  try {
    const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const response = await fetch(`${base}/api/health`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, status: response.status, detail: "Health endpoint unavailable." };
    }
    const data = (await response.json()) as Record<string, unknown>;
    return { ok: true, status: 200, detail: "Operational", data };
  } catch {
    return { ok: false, status: 503, detail: "Health endpoint unavailable." };
  }
}

export default async function StatusPage() {
  const health = await readHealth();

  return (
    <MarketingShell
      showHeader={false}
      footerVariant="minimal-center"
      className="vsm-docs-surface"
      contentClassName="pt-6 pb-10"
    >
      <section className="relative z-10 mx-auto max-w-[70ch] space-y-4">
        <header className="flex items-center justify-between gap-3 pb-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/64">
            Status
          </p>
          <Link href="/" className="ui-transition text-[12px] text-white/56 hover:text-white/84">
            Back to Home
          </Link>
        </header>

        <DocsArticle
          title="System Health"
          intro="Live service status for Vanguard Security & Management endpoints."
        >
          <DocsSection title="Current platform state">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={
                  health.ok
                    ? "rounded-full border border-emerald-300/35 bg-emerald-300/14 px-2.5 py-1 text-[11px] font-semibold text-emerald-200"
                    : "rounded-full border border-amber-300/35 bg-amber-300/14 px-2.5 py-1 text-[11px] font-semibold text-amber-200"
                }
              >
                {health.ok ? "Operational" : "Degraded"}
              </span>
              <span className="text-[12px] text-white/56">HTTP {health.status}</span>
            </div>
            <p className="mt-2 text-[13px] text-white/66">{health.detail}</p>
          </DocsSection>

          <DocsSection title="What this page indicates">
            This page reflects service endpoint health only. Application-level permission errors or
            tenant scoping denials are expected behavior and do not indicate an outage.
          </DocsSection>

          <DocsCallout>
            For operators: verify login, dashboard load, and audit read path after any deployment
            marked degraded.
          </DocsCallout>

          <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
        </DocsArticle>
      </section>
    </MarketingShell>
  );
}
