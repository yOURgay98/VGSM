import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="space-y-10">
        <header className="max-w-[52rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Features
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Built like a system utility. Operated like an incident console.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            VSM focuses on density, speed, and safety. Every sensitive action is permission-gated
            and audited, with workflow tooling designed to stay readable under pressure.
          </p>
        </header>

        <div className="grid gap-3 lg:grid-cols-2">
          <Feature
            title="3-pane utility UI"
            body="List + inspector workflows across Players, Cases, Reports, Dispatch, and Inbox."
          />
          <Feature
            title="Command bar (Cmd/Ctrl+K)"
            body="Run structured commands with validation, confirmations, and approvals for high risk."
          />
          <Feature
            title="RBAC + approvals + sensitive mode"
            body="Strict posture for privilege escalation prevention and two-person rule workflows."
          />
          <Feature
            title="SOC dashboard"
            body="Security events, suspicious sessions, lockouts, and high-risk activity in one place."
          />
          <Feature
            title="Dispatch/CAD core"
            body="Calls, units, transitions, and event timelines with supervisor tooling."
          />
          <Feature
            title="Tactical map"
            body="Static tactical canvas with POIs, zones, calls, pings, labels, and per-user view state."
          />
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          <FeatureMetric
            title="Tenant Isolation"
            body="Every operation is community-scoped with server-side enforcement and critical violation logging."
            value="Strict"
          />
          <FeatureMetric
            title="Command Safety"
            body="High-risk operations route through approvals and audit trails before execution."
            value="2-Person Rule"
          />
          <FeatureMetric
            title="Operations Throughput"
            body="Dispatch, triage, and player actions are optimized for dense, fast workflows."
            value="Utility UI"
          />
        </section>
      </section>
    </MarketingShell>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="ui-transition rounded-[26px] border border-white/10 bg-white/[0.05] p-5 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]">
      <p className="text-[13px] font-semibold text-white">{title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/65">{body}</p>
    </div>
  );
}

function FeatureMetric({ title, body, value }: { title: string; body: string; value: string }) {
  return (
    <div className="ui-transition rounded-[26px] border border-white/10 bg-white/[0.05] p-5 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
        {title}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/65">{body}</p>
    </div>
  );
}
