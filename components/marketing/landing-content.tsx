"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const PILLARS = [
  {
    title: "Structured Logging",
    body: "Every sensitive action is recorded with traceable context and role-scoped visibility.",
  },
  {
    title: "Operational Command",
    body: "Moderation and dispatch workflows stay predictable under pressure.",
  },
  {
    title: "Security Intelligence",
    body: "Signals and controls are designed for hostile environments, not ideal conditions.",
  },
] as const;

export function LandingContent({ isAuthed }: { isAuthed: boolean }) {
  const reduced = useReducedMotion();
  const [shimmerActive, setShimmerActive] = useState(false);

  useEffect(() => {
    if (reduced) return;

    let mounted = true;
    const timers: number[] = [];

    const runSweep = () => {
      if (!mounted) return;
      setShimmerActive(true);

      const endTimer = window.setTimeout(() => {
        if (!mounted) return;
        setShimmerActive(false);
        const waitMs = 12_000 + Math.floor(Math.random() * 8_000);
        const nextTimer = window.setTimeout(runSweep, waitMs);
        timers.push(nextTimer);
      }, 1950);

      timers.push(endTimer);
    };

    const initialTimer = window.setTimeout(runSweep, 550);
    timers.push(initialTimer);

    return () => {
      mounted = false;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduced]);

  const primaryHref = isAuthed ? "/app" : "/login";

  return (
    <div className="relative isolate overflow-x-clip">
      <section
        id="marketing-hero"
        className="relative flex min-h-[100svh] items-center justify-center overflow-hidden py-20"
      >
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-[78rem] text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/58">
            Vanguard Security &amp; Management
          </p>

          <h1 className="mx-auto mt-6 max-w-[13ch] text-balance text-[clamp(3.2rem,11vw,8rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
            <span className="block">Authority,</span>
            <span className="mt-1 block">
              <span className={`vsm-headline-shimmer ${shimmerActive ? "vsm-headline-shimmer-run" : ""}`}>
                <span className="vsm-headline-shimmer-text">Structured.</span>
              </span>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[33ch] text-[clamp(0.94rem,2.1vw,1.08rem)] leading-relaxed text-white/62">
            Built for controlled environments.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
            <Link href={primaryHref} className="mkt-btn mkt-btn-primary min-w-[158px]">
              Enter Vanguard
            </Link>
            <button
              type="button"
              className="mkt-btn mkt-btn-secondary min-w-[158px]"
              onClick={() => {
                const section = document.getElementById("landing-pillars");
                if (!section) return;
                section.scrollIntoView({
                  behavior: reduced ? "auto" : "smooth",
                  block: "start",
                });
              }}
            >
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      <section id="landing-pillars" className="relative z-10 mx-auto w-full max-w-[68rem] pb-14 pt-28">
        <motion.p
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="text-center text-[clamp(1rem,2.7vw,1.36rem)] font-medium tracking-[0.01em] text-white/78"
        >
          Designed for decisive command.
        </motion.p>

        <div className="relative mt-14 grid gap-10 pt-8 md:grid-cols-3 md:gap-10">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.08]" />
          {PILLARS.map((pillar) => (
            <motion.div
              key={pillar.title}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.24, ease: EASE }}
              className="ui-transition text-center md:text-left md:hover:-translate-y-0.5"
            >
              <p className="text-[12.5px] font-semibold tracking-[0.02em] text-white/86 md:min-h-[1.3rem]">
                {pillar.title}
              </p>
              <p className="mx-auto mt-2 max-w-[30ch] text-[12px] leading-relaxed text-white/58 md:mx-0 md:max-w-[23ch]">
                {pillar.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
