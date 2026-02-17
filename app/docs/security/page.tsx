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
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Security
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Security Model
        </h1>
        <p className="mt-2 text-[14px] text-[color:var(--text-muted)]">
          VSM is designed for security-first operations with strict tenant and permission
          boundaries.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)]">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">Threat model</p>
            <ul className="mt-2 grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              {threats.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)]">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
              Core protections
            </p>
            <ul className="mt-2 grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              {controls.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/docs/deploy"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
          >
            Deployment Checklist
          </Link>
          <Link
            href="/docs"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Back to Docs
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
