import { MarketingShell } from "@/components/marketing/marketing-shell";

const CONTACT_EMAIL = "support@vsm.example";

export default function TermsPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Terms
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Terms of Service
        </h1>
        <p className="mt-2 text-[13px] text-[color:var(--text-muted)]">
          Last updated: February 16, 2026
        </p>

        <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-[color:var(--text-muted)]">
          <Section title="1. Eligibility">
            VSM is intended for moderation and operations teams. You must be at least 13 years old
            to use the service. Community owners are responsible for ensuring staff access is
            appropriate for their region and local requirements.
          </Section>

          <Section title="2. Account Responsibility">
            You are responsible for your account credentials, security settings, and all actions
            performed from your account. Use strong passwords, enable 2FA when available, and
            immediately report suspected compromise.
          </Section>

          <Section title="3. Acceptable Use">
            You may use VSM only for legitimate moderation, dispatch coordination, and community
            safety workflows. All actions are logged for accountability and security.
          </Section>

          <Section title="4. Prohibited Use">
            You must not abuse, harass, or target users through the platform. You must not attempt
            to bypass permissions, brute-force access keys, reverse engineer protected flows,
            exploit vulnerabilities, or use VSM for cheating/hacking activity.
          </Section>

          <Section title="5. Security Policy">
            VSM enforces role-based access control, session monitoring, and audit trails. Any
            attempt to tamper with authentication, tenant boundaries, or security controls may
            result in immediate suspension and evidence preservation for investigation.
          </Section>

          <Section title="6. Service Availability">
            VSM is provided on an "as available" basis. We may perform maintenance, security
            updates, or emergency changes that temporarily affect availability. You should maintain
            backup operational procedures.
          </Section>

          <Section title="7. Suspension and Termination">
            We may suspend or terminate access for violations of these terms, abuse of security
            mechanisms, or behavior that threatens platform integrity. Community owners may also
            remove staff access from their own community.
          </Section>

          <Section title="8. Changes to These Terms">
            We may update these terms as the product evolves. Continued use after updates means you
            accept the revised terms. Significant changes should be communicated through release
            notes or admin notices.
          </Section>

          <Section title="9. Contact">
            Questions about these terms can be sent to{" "}
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
