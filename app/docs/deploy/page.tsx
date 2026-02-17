import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

const requiredEnv = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AUTH_ENCRYPTION_KEY",
  "OWNER_EMAIL",
  "OWNER_BOOTSTRAP_PASSWORD",
] as const;

const deploySteps = [
  "Provision managed PostgreSQL (recommended) and enable backups.",
  "Set all required environment variables in your host secrets panel.",
  "Run `npx prisma migrate deploy` against production.",
  "Build/start app: `npm run build` then `npm run start`.",
  "Sign in as OWNER, change bootstrap password, enable 2FA.",
  "Verify login/sign-out, key gate, and audit logging before inviting staff.",
] as const;

export default function DeployDocsPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Deploy
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Production Deployment Checklist
        </h1>
        <p className="mt-2 text-[14px] text-[color:var(--text-muted)]">
          Use this checklist to deploy VSM securely on public hosting.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <article className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)]">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
              Required environment variables
            </p>
            <ul className="mt-2 grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              {requiredEnv.map((key) => (
                <li key={key}>
                  <code>{key}</code>
                </li>
              ))}
            </ul>
          </article>

          <article className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)]">
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
              Deployment steps
            </p>
            <ol className="mt-2 grid gap-1 text-[13px] text-[color:var(--text-muted)]">
              {deploySteps.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/app"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
          >
            Open Web App
          </Link>
          <Link
            href="/docs/security"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
          >
            Security Guide
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
