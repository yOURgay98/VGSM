"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Command, ShieldCheck, Radio, ScrollText, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourStep = {
  id: string;
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
  cta?: string;
  href?: string;
};

const STEPS: TourStep[] = [
  {
    id: "intro",
    title: "Welcome to Vanguard Security & Management",
    body: "Built by Vice & Jack. This onboarding walkthrough prepares you for your first shift in under a minute.",
    icon: ShieldCheck,
  },
  {
    id: "inbox",
    title: "Inbox Triage",
    body: "Start in Inbox to process pending reports, open cases, and approval tasks.",
    icon: Users,
    cta: "Open Inbox",
    href: "/app/inbox",
  },
  {
    id: "dispatch",
    title: "Dispatch + Tactical Map",
    body: "Create calls, assign units, and coordinate map overlays from one compact control flow.",
    icon: Radio,
    cta: "Open Dispatch",
    href: "/app/dispatch?map=1",
  },
  {
    id: "commands",
    title: "Command Palette",
    body: "Press Ctrl/Cmd + K to run vetted commands quickly with approval checks for high-risk actions.",
    icon: Command,
    cta: "Open Commands",
    href: "/app/commands",
  },
  {
    id: "security",
    title: "Security + Audit",
    body: "Review SOC signals and tamper-evident audit logs to keep moderator actions accountable.",
    icon: ScrollText,
    cta: "Open Security",
    href: "/app/security",
  },
];

export function WelcomeExperience({
  inviteToken,
  communityName,
}: {
  inviteToken: string;
  communityName: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const step = STEPS[index]!;
  const Icon = step.icon;

  useEffect(() => {
    if (!autoPlay) return;
    const handle = window.setTimeout(() => {
      setIndex((prev) => (prev + 1 >= STEPS.length ? prev : prev + 1));
    }, 4200);
    return () => window.clearTimeout(handle);
  }, [autoPlay, index]);

  const progressLabel = useMemo(() => `${index + 1} / ${STEPS.length}`, [index]);

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-3xl rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--window-shadow)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
              Vanguard Security &amp; Management
            </p>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              Invite token verified for{" "}
              <span className="font-medium text-[color:var(--text-main)]">{communityName}</span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/invite/${encodeURIComponent(inviteToken)}`)}
          >
            Redeem Invite
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
          <motion.div
            className="grid h-44 place-items-center bg-[radial-gradient(circle_at_20%_22%,rgba(10,132,255,0.28),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(30,64,175,0.22),transparent_48%),linear-gradient(145deg,rgba(9,11,15,0.72)_0%,rgba(8,11,18,0.62)_55%,rgba(9,11,15,0.74)_100%)]"
            initial={{ opacity: 0.35, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-white/85">Interactive onboarding ready</p>
          </motion.div>
        </div>

        <div className="mt-4 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[11px] border border-[color:var(--border)] bg-[color:var(--surface)]">
                  <Icon className="h-4 w-4 text-[color:var(--text-main)]" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    Guided Tour
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight text-[color:var(--text-main)]">
                    {step.title}
                  </h2>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">{step.body}</p>
              {step.cta && step.href ? (
                <Button variant="outline" onClick={() => router.push(step.href!)}>
                  {step.cta}
                </Button>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {STEPS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  setAutoPlay(false);
                }}
                className={cn(
                  "h-1.5 w-7 rounded-full transition-colors",
                  i === index ? "bg-[var(--accent)]" : "bg-black/[0.12] dark:bg-white/[0.2]",
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
            <span className="text-xs text-[color:var(--text-muted)]">{progressLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push("/app/dashboard")}>
              Skip Tour
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAutoPlay(false);
                setIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={index === 0}
            >
              Back
            </Button>
            {index + 1 < STEPS.length ? (
              <Button
                onClick={() => {
                  setAutoPlay(false);
                  setIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
                }}
              >
                Next
              </Button>
            ) : (
              <Button onClick={() => router.push("/app/dashboard")}>
                You&rsquo;re Ready
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
