"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { MarketingSectionTabs } from "@/components/marketing/marketing-section-tabs";
import { ProductHeroVisual } from "@/components/marketing/product-hero-visual";
import { cn } from "@/lib/utils";

const easeInOut: [number, number, number, number] = [0.4, 0, 0.2, 1];

const OVERVIEW_TILES = [
  {
    title: "Security & RBAC",
    body: "Tenant-scoped roles and permissions with strict server-side enforcement and no privilege escalation.",
  },
  {
    title: "Approvals & Commands",
    body: "High-risk actions can require two-person approval, with typed payload verification and audit trails.",
  },
  {
    title: "Dispatch & Tactical Map",
    body: "Calls, units, and operational map tools including pings, POIs, zones, grid overlays, and location picking.",
  },
  {
    title: "Audit Integrity",
    body: "Append-only audit log with a tamper-evident hash chain and integrity verification.",
  },
  {
    title: "Control Utility",
    body: "A compact control-window workflow designed for fast, multi-monitor operations.",
  },
  {
    title: "SOC Signals",
    body: "Security events, suspicious-session signals, lockouts, and activity visibility built into the console.",
  },
] as const;

const SECURITY_TILES = [
  {
    title: "2FA enforcement",
    body: "TOTP with backup codes, plus per-community enforcement for sensitive roles and workflows.",
  },
  {
    title: "Session controls",
    body: "Database sessions with revoke controls, device visibility, and safe sign-out behavior.",
  },
  {
    title: "Abuse protection",
    body: "Rate limiting on login, key redemption, and sensitive endpoints to reduce brute-force attempts.",
  },
  {
    title: "Tenant isolation",
    body: "Every read/write is scoped by communityId. Cross-tenant attempts return 404 and are audited.",
  },
] as const;

const DISPATCH_TILES = [
  {
    title: "Call lifecycle",
    body: "Server-enforced state machine with event timeline logging for every transition and assignment.",
  },
  {
    title: "Location workflows",
    body: "Pick a call location directly on the map, ping it for staff, and keep coordination fast and consistent.",
  },
  {
    title: "Map layers",
    body: "Operational overlays for calls, units, POIs, zones, and grid/postal helpers to reduce decision time.",
  },
  {
    title: "Moderation desk",
    body: "Queue-first workflows with macros to standardize actions and keep outcomes consistent across staff.",
  },
] as const;

const AUDIT_TILES = [
  {
    title: "Integrity chain",
    body: "Hash-linked audit entries expose tampering. Verify recent windows without scanning the entire table.",
  },
  {
    title: "Accountability",
    body: "Every sensitive action records who, what, when, and why, with structured metadata and actor context.",
  },
  {
    title: "Export-ready",
    body: "Audit browsing and exports are permission-gated with tenant scoping and consistent pagination.",
  },
] as const;

export function LandingContent({ isAuthed }: { isAuthed: boolean }) {
  const reduced = useReducedMotion();

  const hero = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.24,
        ease: easeInOut,
        when: "beforeChildren" as const,
        staggerChildren: 0.06,
      },
    },
  };

  const line = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: easeInOut } },
  };

  const primaryHref = isAuthed ? "/app" : "/login";
  const primaryLabel = isAuthed ? "Open Dashboard" : "Sign in";

  return (
    <div className="space-y-16">
      <section id="marketing-hero" className="scroll-mt-24 pt-2">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-28 -z-10 h-[520px] w-[min(860px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-[64px] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.08),transparent_62%)] blur-3xl"
        />

        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div initial="hidden" animate="show" variants={hero} className="max-w-[34rem]">
            <motion.p variants={line} className="text-[11px] font-medium tracking-[0.18em] text-white/55">
              Security-first operations console
            </motion.p>
            <motion.h1
              variants={line}
              className="mt-3 text-[40px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[48px]"
            >
              Vanguard Security &amp; Management
            </motion.h1>
            <motion.p
              variants={line}
              className="mt-4 text-[15px] leading-relaxed text-white/70 sm:text-[16px]"
            >
              Security controls, moderation tooling, dispatch systems, and audit integrity, designed
              to stay calm under pressure.
            </motion.p>

            <motion.div variants={line} className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="mkt-btn mkt-btn-primary"
              >
                {primaryLabel}
              </Link>
              <Link
                href="/download"
                className="mkt-btn mkt-btn-secondary"
              >
                Download Desktop
              </Link>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("overview");
                  if (!el) return;
                  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                }}
                className="mkt-link"
              >
                Explore features
              </button>
            </motion.div>

            <motion.p variants={line} className="mt-4 text-xs text-white/55">
              Built for secure workflows: tenant isolation, 2FA enforcement, and audited high-risk
              actions by default.
            </motion.p>
          </motion.div>

          <div className="lg:justify-self-end">
            <ProductHeroVisual />
          </div>
        </div>

        <MarketingSectionTabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "security", label: "Security" },
            { id: "dispatch", label: "Dispatch" },
            { id: "audit", label: "Audit" },
            { id: "download", label: "Download" },
          ]}
        />
      </section>

      <MarketingSection
        id="overview"
        kicker="Overview"
        title="A console built for speed, safety, and focus."
        body="VSM keeps staff workflows dense and predictable: list + inspector layouts, strict permissions, and operations tooling designed for real-time coordination."
      >
        <TileGrid tiles={OVERVIEW_TILES} />
      </MarketingSection>

      <MarketingSection
        id="security"
        kicker="Security"
        title="Designed for hostile environments."
        body="Assume attackers will brute force keys, tamper with clients, and probe tenant boundaries. VSM enforces server-side checks, rate limits, and visibility for every sensitive workflow."
      >
        <TileGrid tiles={SECURITY_TILES} />
      </MarketingSection>

      <MarketingSection
        id="dispatch"
        kicker="Dispatch"
        title="Operational tooling that stays readable under pressure."
        body="Dispatch calls and coordinate teams with predictable state transitions, timeline logging, and tactical map overlays that stay fast on every machine."
      >
        <TileGrid tiles={DISPATCH_TILES} />
      </MarketingSection>

      <MarketingSection
        id="audit"
        kicker="Audit"
        title="Accountability you can verify."
        body="Every sensitive action is recorded. Audit integrity is cryptographically linked so tampering shows up immediately in verification checks."
      >
        <TileGrid tiles={AUDIT_TILES} />
      </MarketingSection>

      <MarketingSection
        id="download"
        kicker="Download"
        title="Desktop utility, web-first security."
        body="VSM Desktop is a focused wrapper around the web console. Sessions and permissions remain enforced by the same backend."
      >
        <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5">
          <p className="text-[13px] font-semibold text-white">Desktop builds</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">
            When desktop releases are published, downloads are one click for Windows, macOS, and
            Linux. The web console remains the source of truth for sessions and permissions.
          </p>
          <Link href="/download" className="mkt-link mt-3 inline-flex">
            Go to Download
          </Link>
        </div>
      </MarketingSection>
    </div>
  );
}

function MarketingSection({
  id,
  kicker,
  title,
  body,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();

  const content = (
    <div className="grid gap-10 lg:grid-cols-[0.44fr_0.56fr]">
      <div className="max-w-[26rem]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {kicker}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-white/65">{body}</p>
      </div>
      <div>{children}</div>
    </div>
  );

  if (reduced) {
    return (
      <section id={id} className="scroll-mt-32 pt-2">
        {content}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className="scroll-mt-32 pt-2"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.24, ease: easeInOut }}
    >
      {content}
    </motion.section>
  );
}

function TileGrid({
  tiles,
}: {
  tiles: ReadonlyArray<{ title: string; body: string }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tiles.map((tile) => (
        <div
          key={tile.title}
          className={cn(
            "ui-transition rounded-[22px] border border-white/10 bg-white/[0.05] p-4",
            "hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]",
          )}
        >
          <p className="text-[13px] font-semibold text-white">{tile.title}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/65">{tile.body}</p>
        </div>
      ))}
    </div>
  );
}

// Quick links removed to avoid CTA spam. Navigation lives in the top nav and hero CTAs.
