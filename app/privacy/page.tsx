import { MarketingShell } from "@/components/marketing/marketing-shell";

const CONTACT_EMAIL = "privacy@vsm.example";

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Privacy
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[13px] text-[color:var(--text-muted)]">
          Last updated: February 16, 2026
        </p>

        <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-[color:var(--text-muted)]">
          <Section title="1. What We Collect">
            We collect account identifiers (email, name), authentication/session records, IP
            addresses, user agent strings, moderation actions, dispatch activity, audit logs, and
            operational metadata needed to run VSM.
          </Section>

          <Section title="2. Why We Collect It">
            Data is used to authenticate users, enforce permissions, prevent abuse, support
            moderation workflows, coordinate operations, investigate incidents, and maintain
            tamper-evident audit records.
          </Section>

          <Section title="3. Retention">
            Operational and security logs are retained as long as needed for moderation
            accountability and platform safety. Communities may configure shorter retention where
            supported. Expired sessions and obsolete data are periodically cleaned up.
          </Section>

          <Section title="4. Sharing">
            We do not sell personal data. Information may be shared with infrastructure/service
            providers strictly to operate the platform, and with lawful authorities if legally
            required.
          </Section>

          <Section title="5. Security Measures">
            We use role-based access controls, password hashing, session controls, optional 2FA,
            rate limiting, audit logging, and tenant isolation checks to protect data and reduce
            abuse risk.
          </Section>

          <Section title="6. User Rights">
            Depending on your region, you may request access, correction, or deletion of your
            account data where applicable. Community-level moderation records may be retained when
            needed for security and compliance.
          </Section>

          <Section title="7. Contact">
            Privacy requests and questions can be sent to{" "}
            <span className="font-medium text-[color:var(--text-main)]">{CONTACT_EMAIL}</span>.
          </Section>
        </div>
      </section>
    </MarketingShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]">
      <h2 className="text-[14px] font-semibold text-[color:var(--text-main)]">{title}</h2>
      <p className="mt-1">{children}</p>
    </section>
  );
}
