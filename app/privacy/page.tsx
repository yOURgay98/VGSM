import Link from "next/link";

import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const CONTACT_EMAIL = "johnnywoodswork@gmail.com";

export default function PrivacyPage() {
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
            Privacy
          </p>
          <Link href="/" className="ui-transition text-[12px] text-white/56 hover:text-white/84">
            Back to Home
          </Link>
        </header>

        <DocsArticle
          title="Privacy / Data Policy"
          intro="This policy explains what Vanguard collects, what is excluded, and how data is protected in day-to-day operations."
        >
          <DocsSection title="What we collect">
            Account identity (email and profile fields), tenant membership/role data, session
            metadata, moderation actions, dispatch operations, and audit records required for
            accountability.
          </DocsSection>

          <DocsSection title="What we explicitly do not store as raw values">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We do NOT store raw IP addresses in standard audit records.</li>
              <li>We do NOT store plaintext access keys or token secrets.</li>
              <li>We do NOT store raw credential payloads in action metadata.</li>
            </ul>
          </DocsSection>

          <DocsSection title="Why data is used">
            Data supports authentication, abuse prevention, moderation workflows, incident response,
            and post-incident verification through audit trails.
          </DocsSection>

          <DocsSection title="Retention">
            Retention is based on security and operational accountability requirements. Retention
            controls are tightened by policy and can be further configured over time.
          </DocsSection>

          <DocsSection title="Contact">
            Privacy requests and policy questions can be sent to{" "}
            <a className="text-white/85 hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </DocsSection>

          <DocsCallout>
            This page is aligned with the docs privacy statement at{" "}
            <Link href="/docs/privacy" className="text-white/90 underline-offset-2 hover:underline">
              /docs/privacy
            </Link>
            .
          </DocsCallout>

          <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
        </DocsArticle>
      </section>
    </MarketingShell>
  );
}
