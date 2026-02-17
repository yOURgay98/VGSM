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
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Deploy
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Production Deployment Checklist
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            Use this checklist to deploy VSM securely on public hosting.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[13px] font-semibold text-white">Required environment variables</p>
            <ul className="mt-3 grid gap-1 text-[13px] text-white/65">
              {requiredEnv.map((key) => (
                <li key={key}>
                  <code className="text-white/80">{key}</code>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[13px] font-semibold text-white">Deployment steps</p>
            <ol className="mt-3 grid gap-1 text-[13px] text-white/65">
              {deploySteps.map((step, index) => (
                <li key={step}>
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </article>
        </div>

        {/* CTAs live in the top nav and the landing hero. */}
      </section>
    </MarketingShell>
  );
}
