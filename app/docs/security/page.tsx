import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

const threats = [
  "Credential stuffing and password brute force",
  "Invite/access-key brute force or replay",
  "Cross-tenant access attempts",
  "Privilege escalation via client tampering",
  "Abuse of high-risk commands/actions",
] as const;

const controls = [
  "Database sessions + server-side RBAC permission checks",
  "Tenant-scoped queries and membership enforcement",
  "Rate limiting for login, key redemption, and sensitive endpoints",
  "Audit logging for auth, keys, role changes, approvals",
  "Production headers (CSP, HSTS, referrer/content protections)",
] as const;

export default function SecurityDocsPage() {
  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Security
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Security Model</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            VSM is designed for security-first operations with strict tenant and permission
            boundaries.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[13px] font-semibold text-white">Threat model</p>
            <ul className="mt-3 grid gap-1 text-[13px] text-white/65">
              {threats.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[13px] font-semibold text-white">Core protections</p>
            <ul className="mt-3 grid gap-1 text-[13px] text-white/65">
              {controls.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <p className="text-[13px] text-white/60">
          Continue reading in <Link href="/docs/deploy" className="mkt-link">Deploy</Link> for the
          production checklist.
        </p>
      </section>
    </MarketingShell>
  );
}
