import Link from "next/link";

import { DocsSidebar } from "@/components/marketing/docs-sidebar";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell
      showHeader={false}
      footerVariant="minimal-center"
      className="vsm-docs-surface"
      contentClassName="pt-6 pb-10"
    >
      <section className="relative z-10">
        <header className="flex items-center justify-between gap-3 pb-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/64">
            Vanguard Docs
          </p>
          <Link href="/" className="ui-transition text-[12px] text-white/56 hover:text-white/84">
            Back to Home
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <DocsSidebar />
          </aside>
          <main className="min-w-0">
            <div className="max-w-[70ch]">{children}</div>
          </main>
        </div>
      </section>
    </MarketingShell>
  );
}
