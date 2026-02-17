"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type PreviewId = "inbox" | "dispatch" | "audit";
type PreviewStage = PreviewId | "blank";

const PREVIEWS: Array<{ id: PreviewId; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "dispatch", label: "Dispatch" },
  { id: "audit", label: "Audit" },
];

const easeInOut = "easeInOut";

const TIMING_MS = {
  inbox: 9_200,
  dispatch: 5_000,
  audit: 5_200,
  loopBlank: 220,
} as const;

export function ProductHeroVisual({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const [stage, setStage] = useState<PreviewStage>("inbox");
  const [lastPreview, setLastPreview] = useState<PreviewId>("inbox");
  const [pageVisible, setPageVisible] = useState(true);
  const previews = useMemo(() => PREVIEWS, []);

  useEffect(() => {
    // Keep the header label stable during the brief loop-fade blank stage.
    if (stage !== "blank") setLastPreview(stage);
  }, [stage]);

  useEffect(() => {
    // Pause the timeline when the tab is inactive so the animation doesn't "fast-forward"
    // while the user is away.
    const onVisibilityChange = () => setPageVisible(document.visibilityState === "visible");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    // Clear any pending timers before scheduling the next stage.
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];

    if (!pageVisible) return;

    const schedule = (next: PreviewStage, delayMs: number) => {
      const id = window.setTimeout(() => setStage(next), delayMs);
      timersRef.current.push(id);
    };

    if (stage === "inbox") schedule("dispatch", TIMING_MS.inbox);
    if (stage === "dispatch") schedule("audit", TIMING_MS.dispatch);
    if (stage === "audit") schedule("blank", TIMING_MS.audit);
    if (stage === "blank") schedule("inbox", TIMING_MS.loopBlank);

    return () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    };
  }, [pageVisible, stage]);

  function setTilt(rx: number, ry: number) {
    const el = shellRef.current;
    if (!el) return;
    el.style.setProperty("--vsm-tilt-x", `${rx.toFixed(3)}deg`);
    el.style.setProperty("--vsm-tilt-y", `${ry.toFixed(3)}deg`);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced) return;
    const el = shellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / Math.max(1, rect.width);
    const py = (event.clientY - rect.top) / Math.max(1, rect.height);

    // Keep tilt extremely subtle (premium, not gimmicky).
    const ry = (px - 0.5) * 2.2;
    const rx = -(py - 0.5) * 2.2;

    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      setTilt(rx, ry);
    });
  }

  function onPointerLeave() {
    if (reduced) return;
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTilt(0, 0);
  }

  return (
    <div className={cn("relative", className)}>
      <div className="mx-auto w-full max-w-[560px]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[42px] bg-white/[0.02]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_55%_34%,rgba(255,255,255,0.08),transparent_60%)] opacity-70"
          />

          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
            <div
              ref={shellRef}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              style={
                {
                  ["--vsm-tilt-x" as never]: "0deg",
                  ["--vsm-tilt-y" as never]: "0deg",
                } as React.CSSProperties
              }
              className={cn(
                "group relative w-full max-w-[520px]",
                "transform-gpu [transform:perspective(1400px)_rotateX(var(--vsm-tilt-x))_rotateY(var(--vsm-tilt-y))]",
                "transition-transform duration-200 ease-out",
                reduced ? "[transform:none]" : "",
              )}
            >
              <div className="relative overflow-hidden rounded-[34px] bg-white/[0.05] shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_36px_80px_-72px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.14),transparent_58%),radial-gradient(circle_at_92%_6%,rgba(255,255,255,0.06),transparent_55%)] opacity-75"
                />

                <div className="relative p-3">
                  <div className="flex items-center justify-between rounded-[22px] border border-white/[0.08] bg-black/35 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/14" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                      <span className="hidden sm:inline">VSM Console</span>
                      <span className="h-4 w-px bg-white/10" aria-hidden />
                      <span className="text-white/55">
                        {previews.find((p) => p.id === lastPreview)?.label}
                      </span>
                    </div>
                  </div>

                  <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,rgba(7,9,12,0.92)_0%,rgba(6,7,10,0.95)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={stage}
                        initial={{ opacity: 0, y: stage === "blank" ? 0 : 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: stage === "blank" ? 0 : -4 }}
                        transition={{
                          duration: stage === "blank" ? 0.2 : 0.48,
                          ease: easeInOut,
                        }}
                        className="absolute inset-0 p-4"
                      >
                        {stage === "inbox" ? (
                          <PreviewInbox pan={!reduced && pageVisible} />
                        ) : null}
                        {stage === "dispatch" ? (
                          <PreviewDispatch animate={!reduced && pageVisible} />
                        ) : null}
                        {stage === "audit" ? (
                          <PreviewAudit animate={!reduced && pageVisible} />
                        ) : null}
                        {stage === "blank" ? <PreviewBlank /> : null}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-[34px]",
                  "opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_0_28px_-22px_color-mix(in_srgb,var(--accent)_28%,transparent)]",
                  reduced ? "opacity-0" : "",
                )}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-white/60">
        Preview renders are illustrative. Real UI appears after sign-in.
      </p>
    </div>
  );
}

function PreviewInbox({ pan }: { pan: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-[0.62fr_0.38fr]">
      <div className="min-w-0 space-y-2 rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Inbox
          </p>
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white/70">
            6 pending
          </span>
        </div>

        {/* Auto-scroll is contained to the list viewport so the overall layout never "slides out" of the frame. */}
        <div className="relative overflow-hidden rounded-[16px]">
          <motion.div
            initial={{ y: 0 }}
            animate={
              pan
                ? {
                    y: [0, 0, -48, -48, -96, -96],
                  }
                : { y: 0 }
            }
            transition={
              pan
                ? {
                    duration: TIMING_MS.inbox / 1000,
                    ease: easeInOut,
                    times: [0, 0.18, 0.42, 0.56, 0.78, 1],
                  }
                : { duration: 0 }
            }
            className="space-y-2"
          >
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-2.5 w-[70%] rounded bg-white/20" />
                  <div className="h-2 w-[86%] rounded bg-white/10" />
                </div>
                <div className="ml-3 h-6 w-6 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_60%,transparent)] opacity-55" />
              </div>
            ))}
          </motion.div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-[linear-gradient(180deg,rgba(0,0,0,0.52)_0%,transparent_100%)] opacity-70"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(0deg,rgba(0,0,0,0.52)_0%,transparent_100%)] opacity-70"
          />
        </div>
      </div>

      <div className="min-w-0 rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
          Inspector
        </p>
        <div className="mt-3 space-y-2">
          <div className="h-2.5 w-[78%] rounded bg-white/20" />
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-[90%] rounded bg-white/10" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-8 rounded-[12px] bg-white/[0.08]" />
            <div className="h-8 rounded-[12px] bg-white/[0.08]" />
          </div>
          <div className="mt-3 h-20 rounded-[14px] border border-white/10 bg-black/20" />
        </div>
      </div>
    </div>
  );
}

function PreviewDispatch({ animate }: { animate: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-[0.44fr_0.56fr]">
      <div className="min-w-0 rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
          Calls
        </p>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-[70%] rounded bg-white/20" />
                <span className="h-2 w-[20%] rounded bg-white/10" />
              </div>
              <div className="mt-2 h-2 w-[82%] rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px] opacity-40"
        />
        <div className="relative flex items-start justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
            Tactical map
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-12 rounded bg-white/10" />
            <span className="h-2.5 w-12 rounded bg-white/10" />
          </div>
        </div>
        <div className="relative mt-3 h-[172px] rounded-[14px] border border-white/10 bg-black/25">
          <motion.div
            aria-hidden
            className="absolute left-[22%] top-[38%] h-3 w-3 rounded-full bg-[color-mix(in_srgb,var(--accent)_70%,transparent)] opacity-80"
            animate={
              animate
                ? {
                    scale: [1, 1.12, 1],
                    opacity: [0.72, 0.92, 0.72],
                  }
                : { scale: 1, opacity: 0.8 }
            }
            transition={
              animate
                ? {
                    duration: 4.6,
                    ease: easeInOut,
                    repeat: Infinity,
                  }
                : { duration: 0 }
            }
          />
          <div className="absolute left-[48%] top-[55%] h-3 w-3 rounded-full bg-white/60 opacity-50" />
          <div className="absolute left-[70%] top-[30%] h-3 w-3 rounded-full bg-white/60 opacity-40" />
          <div className="absolute left-[60%] top-[70%] h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_55%,transparent)] opacity-60" />
        </div>
      </div>
    </div>
  );
}

function PreviewAudit({ animate }: { animate: boolean }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
          Audit chain
        </p>
        <span className="relative">
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(255,255,255,0.16),transparent_62%)]"
            animate={
              animate
                ? {
                    opacity: [0.12, 0.22, 0.12],
                    scale: [1, 1.06, 1],
                  }
                : { opacity: 0.12, scale: 1 }
            }
            transition={
              animate
                ? { duration: 5.4, ease: easeInOut, repeat: Infinity }
                : { duration: 0 }
            }
          />
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white/70">
            integrity OK
          </span>
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-black/20 px-3 py-2"
          >
            <div className="h-7 w-7 rounded-[12px] border border-white/10 bg-white/[0.06]" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-2.5 w-[66%] rounded bg-white/18" />
              <div className="h-2 w-[92%] rounded bg-white/10" />
            </div>
            <span className="h-2 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewBlank() {
  return (
    <div className="h-full w-full rounded-[18px] bg-[linear-gradient(180deg,rgba(7,9,12,0.2)_0%,rgba(6,7,10,0.55)_100%)]" />
  );
}
