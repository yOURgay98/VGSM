"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AppWindowMac,
  Command,
  Radio,
  ScrollText,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { DownloadDesktopCta } from "@/components/marketing/download-desktop-cta";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Security & RBAC",
    body: "Tenant-scoped permissions, strict role checks, session controls, and 2FA enforcement.",
    icon: ShieldCheck,
  },
  {
    title: "Dispatch & Tactical Map",
    body: "Live calls, POIs, zones, pings, and operational workflows in a compact control surface.",
    icon: Radio,
  },
  {
    title: "Audit Integrity",
    body: "Append-only audit chain with integrity status for high-trust workflows.",
    icon: ScrollText,
  },
  {
    title: "Control Utility",
    body: "A focused control-window workflow designed for multi-monitor operations.",
    icon: AppWindowMac,
  },
  {
    title: "Approvals & Commands",
    body: "Command palette execution with approval gates and risk-tiered safeguards.",
    icon: Command,
  },
  {
    title: "Operational Accountability",
    body: "Action history, triage throughput, and role-based traceability.",
    icon: UserCheck,
  },
] as const;

const easeOut: [number, number, number, number] = [0.2, 0, 0, 1];

export function LandingContent() {
  const reducedMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: easeOut,
        when: "beforeChildren" as const,
        staggerChildren: 0.055,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeOut } },
  };

  const heroCard = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: easeOut,
        when: "beforeChildren" as const,
        staggerChildren: 0.055,
        delayChildren: 0.02,
      },
    },
  };

  const heroLine = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeOut } },
  };

  return (
    <motion.div
      initial={reducedMotion ? false : "hidden"}
      animate={reducedMotion ? undefined : "show"}
      variants={container}
      className="space-y-4"
    >
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -top-10 -z-10 h-[240px] rounded-[40px] bg-[radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--accent)_10%,transparent),transparent_62%)] opacity-50 blur-2xl"
        />

        <div className="grid gap-3 lg:grid-cols-[1.06fr_0.94fr]">
          <motion.div
            variants={heroCard}
            className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
          >
            <motion.p
              variants={heroLine}
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]"
            >
              Vanguard Security &amp; Management
            </motion.p>
            <motion.h1
              variants={heroLine}
              className="mt-2 text-[28px] font-semibold leading-[1.16] tracking-tight text-[color:var(--text-main)] lg:text-[32px]"
            >
              Security-first moderation and operations for serious communities.
            </motion.h1>
            <motion.p
              variants={heroLine}
              className="mt-2 text-[15px] leading-relaxed text-[color:var(--text-muted)]"
            >
              VSM is an operational console for trusted staff teams: approvals, command tooling,
              dispatch, tactical map workflows, and tamper-evident auditing in one compact utility
              experience.
            </motion.p>

            <motion.div variants={heroLine} className="mt-4 flex flex-wrap items-center gap-2">
              <DownloadDesktopCta />
              <Link
                href="/features"
                className="ui-transition inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-semibold text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
              >
                Explore features
              </Link>
              <button
                type="button"
                disabled
                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-semibold text-[color:var(--text-muted)] opacity-75"
              >
                Join Discord
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={item}
            className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--panel-shadow)] backdrop-blur-xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Core Capabilities
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {features.map((feat) => (
                <FeatureCard
                  key={feat.title}
                  title={feat.title}
                  body={feat.body}
                  icon={feat.icon}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        variants={item}
        className="rounded-[var(--radius-window)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 shadow-[var(--panel-shadow)] backdrop-blur-xl"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
          First Run Guide
        </p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <GuideItem
            step="1"
            title="Prepare secure access"
            body="Set invite/access-key policy first, then sign in with your assigned staff account."
            linkHref="/docs/security"
            linkLabel="Read security guide"
          />
          <GuideItem
            step="2"
            title="Open your community"
            body="Select the right community in the titlebar and verify your role and permissions."
            linkHref="/app/dashboard"
            linkLabel="Open dashboard"
          />
          <GuideItem
            step="3"
            title="Start operations"
            body="Use Dispatch map controls, inbox triage, and command bar shortcuts."
            linkHref="/docs"
            linkLabel="Read quick docs"
          />
        </div>
      </motion.section>
    </motion.div>
  );
}

function FeatureCard({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <div
      className={cn(
        "ui-transition rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3",
        "hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--accent)_18%,var(--border))]",
        "hover:shadow-[var(--panel-shadow)]",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
          <Icon className="h-4 w-4 text-[color:var(--text-main)]" />
        </span>
        <p className="text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-muted)]">{body}</p>
    </div>
  );
}

function GuideItem({
  step,
  title,
  body,
  linkHref,
  linkLabel,
}: {
  step: string;
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
        Step {step}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[color:var(--text-main)]">{title}</p>
      <p className="mt-1 text-[13px] text-[color:var(--text-muted)]">{body}</p>
      <Link
        href={linkHref}
        className="ui-transition mt-2 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
