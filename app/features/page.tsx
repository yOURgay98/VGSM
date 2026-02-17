import Link from "next/link";

import { MarketingShell } from "@/components/marketing/marketing-shell";

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          Features
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-main)]">
          Built like a system utility. Operated like an incident console.
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--text-muted)]">
          VSM focuses on density, speed, and safety. Every sensitive action is permission-gated and
          audited.
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <Feature
            title="3-pane utility UI"
            body="List + inspector workflow on Players, Cases, Reports, Dispatch, and Inbox."
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
            body="Static ERLC-style map canvas with POIs, zones, calls, pings, and saved per-user view state."
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <div>
            <p className="text-[13px] font-semibold text-[color:var(--text-main)]">
              Ready to open the console?
            </p>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              You will be redirected to staff sign-in.
            </p>
          </div>
          <Link
            href="/app"
            className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:brightness-[1.04]"
          >
            Open Web App
          </Link>
        </div>
      </section>

      <section className="mt-3 grid gap-3 md:grid-cols-3">
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
    </MarketingShell>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 shadow-[var(--panel-shadow)] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_14%,var(--border))]">
      <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--text-muted)]">{body}</p>
    </div>
  );
}

function FeatureMetric({ title, body, value }: { title: string; body: string; value: string }) {
  return (
    <div className="ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--panel-shadow)] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_12%,var(--border))]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
        {title}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-[color:var(--text-main)]">
        {value}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--text-muted)]">{body}</p>
    </div>
  );
}
