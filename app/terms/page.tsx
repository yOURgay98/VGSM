import Link from "next/link";

import { DocsArticle, DocsCallout, DocsSection } from "@/components/marketing/docs-content";
import { MarketingShell } from "@/components/marketing/marketing-shell";

const CONTACT_EMAIL = "johnnywoodswork@gmail.com";

export default function TermsPage() {
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
            Terms
          </p>
          <Link href="/" className="ui-transition text-[12px] text-white/56 hover:text-white/84">
            Back to Home
          </Link>
        </header>

        <DocsArticle
          title="Terms of Service"
          intro="Vanguard is an operations and security platform. These terms define acceptable use and baseline account responsibilities."
        >
          <DocsSection title="Eligibility">
            You must be at least 13 years old to use the service. Community owners are responsible
            for ensuring staff access aligns with local requirements.
          </DocsSection>

          <DocsSection title="Account responsibility">
            You are responsible for your credentials and all activity from your account. Strong
            passwords and two-factor authentication are expected for privileged access.
          </DocsSection>

          <DocsSection title="Acceptable use">
            Vanguard may only be used for legitimate moderation, operational coordination, and
            security workflows within authorized communities.
          </DocsSection>

          <DocsSection title="Prohibited use">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Abuse, harassment, or targeted misuse of platform tools.</li>
              <li>Bypassing permissions, brute forcing keys, or exploiting auth boundaries.</li>
              <li>Reverse engineering protected flows for unauthorized access.</li>
            </ul>
          </DocsSection>

          <DocsSection title="Service availability and changes">
            Service is provided as available. Maintenance and emergency security changes may affect
            uptime. Terms may be updated as product behavior evolves.
          </DocsSection>

          <DocsSection title="Contact">
            Questions about these terms can be sent to{" "}
            <a className="text-white/85 hover:text-white" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </DocsSection>

          <DocsCallout tone="warning">
            Violations involving security abuse or permission bypass may result in immediate
            suspension and evidence retention for investigation.
          </DocsCallout>

          <p className="text-[11px] text-white/46">Last updated: February 23, 2026</p>
        </DocsArticle>
      </section>
    </MarketingShell>
  );
}
