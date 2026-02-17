"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TourStep = {
  id: string;
  title: string;
  body: string;
  route?: string;
  selector?: string;
};

type StartSource = "welcome" | "manual";
type Phase = "idle" | "tour";

type SpotlightDebug = {
  selector: string | null;
  found: boolean;
  reason: string;
  rect: DOMRect | null;
};

const STEPS: TourStep[] = [
  {
    id: "intro",
    title: "Vanguard Security & Management",
    body: "Built by Vice (Lead Dev) and Jack (Co-Founder). This guided tour is under a minute and fully skippable.",
  },
  {
    id: "inbox",
    title: "Inbox Triage",
    body: "Process reports, unassigned cases, and approvals from one queue.",
    route: "/app/inbox",
    selector: '[data-tour="inbox-triage"]',
  },
  {
    id: "players",
    title: "Players + Actions",
    body: "Inspect player history and issue moderated actions quickly.",
    route: "/app/players",
    selector: '[data-tour="players-console"]',
  },
  {
    id: "dispatch",
    title: "Dispatch",
    body: "Create calls and keep incident state synchronized with responders.",
    route: "/app/dispatch?map=1",
    selector: '[data-tour="dispatch-create-call"]',
  },
  {
    id: "map",
    title: "Map Tools",
    body: "Pick call locations, drop pings, and manage layers from the map toolkit.",
    route: "/app/dispatch?map=1",
    selector: '[data-tour="map-toolkit"]',
  },
  {
    id: "commands",
    title: "Command Palette",
    body: "Use Cmd/Ctrl+K to run permission-gated commands with approval controls.",
    route: "/app/dashboard",
    selector: '[data-tour="command-bar-trigger"]',
  },
  {
    id: "security",
    title: "Security + Audit",
    body: "Watch SOC signals and tamper-evident audit trails to keep operations accountable.",
    route: "/app/security",
    selector: '[data-tour="security-dashboard"]',
  },
  {
    id: "complete",
    title: "Welcome to the beta",
    body: "You are set. Open Help any time to re-run this guided tour.",
  },
];

const FOCUS_PADDING = 10;
const TOAST_TIMEOUT_MS = 3400;
const STEP_UNAVAILABLE_TIMEOUT_MS = 800;
const MIN_TARGET_SIZE_PX = 8;
const RECT_LOCK_MS = 520;
const MICRO_DELTA_PX = 2;
const MAJOR_DELTA_PX = 6;
const REMEASURE_THROTTLE_MS = 90;

function normalizeRouteForCompare(route: string) {
  try {
    const url = new URL(route, "http://vsm.local");
    return `${url.pathname}${url.search}`;
  } catch {
    return route;
  }
}

function waitForSelector(selector: string, timeoutMs: number) {
  return new Promise<HTMLElement | null>((resolve) => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      const found = document.querySelector(selector);
      if (found instanceof HTMLElement) {
        window.clearInterval(timer);
        resolve(found);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        window.clearInterval(timer);
        resolve(null);
      }
    }, 80);
  });
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForLayoutSettle() {
  await waitForAnimationFrame();
  await waitForAnimationFrame();
}

function isValidRect(rect: DOMRect | null) {
  if (!rect) return false;
  if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return false;
  if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height)) return false;
  return rect.width >= MIN_TARGET_SIZE_PX && rect.height >= MIN_TARGET_SIZE_PX;
}

function isInsideViewport(rect: DOMRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return rect.right > 0 && rect.bottom > 0 && rect.left < vw && rect.top < vh;
}

function clampToViewport(rect: DOMRect): DOMRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const left = Math.min(Math.max(Math.round(rect.left), 0), Math.max(0, vw - MIN_TARGET_SIZE_PX));
  const top = Math.min(Math.max(Math.round(rect.top), 0), Math.max(0, vh - MIN_TARGET_SIZE_PX));
  const width = Math.round(Math.min(rect.width, Math.max(MIN_TARGET_SIZE_PX, vw - left)));
  const height = Math.round(Math.min(rect.height, Math.max(MIN_TARGET_SIZE_PX, vh - top)));
  return new DOMRect(left, top, width, height);
}

function rectDelta(a: DOMRect, b: DOMRect) {
  return Math.max(
    Math.abs(a.left - b.left),
    Math.abs(a.top - b.top),
    Math.abs(a.width - b.width),
    Math.abs(a.height - b.height),
  );
}

async function measureTargetRect(
  target: HTMLElement,
  options?: { allowScroll?: boolean; attempts?: number },
): Promise<DOMRect | null> {
  const allowScroll = options?.allowScroll === true;
  const attempts = Math.max(1, options?.attempts ?? 3);
  if (!target.isConnected) return null;
  if (allowScroll) {
    target.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await waitForLayoutSettle();
    const rect = target.getBoundingClientRect();
    if (isValidRect(rect) && isInsideViewport(rect)) {
      return clampToViewport(rect);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 85));
  }

  return null;
}

export function AppTour({
  userId,
  communityId,
  isOwner = false,
}: {
  userId: string;
  communityId: string;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [loadedState, setLoadedState] = useState(false);
  const [source, setSource] = useState<StartSource>("manual");
  const [resolving, setResolving] = useState(false);
  const [focusRect, setFocusRect] = useState<DOMRect | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [stepNotice, setStepNotice] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<SpotlightDebug>({
    selector: null,
    found: false,
    reason: "idle",
    rect: null,
  });

  const targetRef = useRef<HTMLElement | null>(null);
  const runningRef = useRef(false);
  const unavailableTimerRef = useRef<number | null>(null);
  const lastAppliedRectRef = useRef<DOMRect | null>(null);
  const lockUntilRef = useRef(0);
  const lastRemeasureAtRef = useRef(0);

  const step = STEPS[stepIndex]!;
  const progressText = `${stepIndex + 1} / ${STEPS.length}`;

  const completionStorageKey = useMemo(
    () => `vsm:tour:welcome:${communityId}:${userId}`,
    [communityId, userId],
  );

  const currentRoute = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const saveTourState = useCallback(async (payload: { completed?: boolean }) => {
    try {
      await fetch("/api/tour/completion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Keep UX smooth even if persistence call fails.
    }
  }, []);

  const clearUnavailableTimer = useCallback(() => {
    if (unavailableTimerRef.current) {
      window.clearTimeout(unavailableTimerRef.current);
      unavailableTimerRef.current = null;
    }
  }, []);

  const applyFocusRect = useCallback(
    (nextRect: DOMRect, options?: { force?: boolean; lock?: boolean }) => {
      const snapped = clampToViewport(nextRect);
      const prev = lastAppliedRectRef.current;
      const now = Date.now();
      const force = options?.force === true;

      if (!force && prev) {
        const delta = rectDelta(prev, snapped);
        if (delta <= MICRO_DELTA_PX) {
          return false;
        }
        if (now < lockUntilRef.current && delta < MAJOR_DELTA_PX) {
          return false;
        }
      }

      if (options?.lock) {
        lockUntilRef.current = now + RECT_LOCK_MS;
      }

      lastAppliedRectRef.current = snapped;
      setFocusRect(snapped);
      return true;
    },
    [],
  );

  const closeTour = useCallback(() => {
    clearUnavailableTimer();
    setPhase("idle");
    setResolving(false);
    setStepNotice(null);
    targetRef.current = null;
    lastAppliedRectRef.current = null;
    lockUntilRef.current = 0;
    lastRemeasureAtRef.current = 0;
    setFocusRect(null);
    runningRef.current = false;
  }, [clearUnavailableTimer]);

  const skipTour = useCallback(() => {
    closeTour();
    router.push("/app/dashboard");
  }, [closeTour, router]);

  const finishTour = useCallback(async () => {
    try {
      window.localStorage.setItem(completionStorageKey, "1");
    } catch {
      // Ignore local storage failures.
    }
    await saveTourState({ completed: true });
    closeTour();
    setToast("You're set. Welcome to the beta.");
    router.push("/app/dashboard");
  }, [closeTour, completionStorageKey, router, saveTourState]);

  const startGuidedTour = useCallback(() => {
    clearUnavailableTimer();
    runningRef.current = true;
    setStepIndex(0);
    setPhase("tour");
    setResolving(false);
    setStepNotice(null);
    targetRef.current = null;
    lastAppliedRectRef.current = null;
    lockUntilRef.current = 0;
    lastRemeasureAtRef.current = 0;
    setFocusRect(null);
  }, [clearUnavailableTimer]);

  const startFlow = useCallback(
    (startSource: StartSource) => {
      if (phase !== "idle") return;
      setSource(startSource);
      startGuidedTour();
    },
    [phase, startGuidedTour],
  );

  const goBack = useCallback(() => {
    clearUnavailableTimer();
    setStepNotice(null);
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, [clearUnavailableTimer]);

  const goNext = useCallback(() => {
    clearUnavailableTimer();
    setStepNotice(null);
    if (stepIndex >= STEPS.length - 1) {
      void finishTour();
      return;
    }
    setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
  }, [clearUnavailableTimer, finishTour, stepIndex]);

  const markStepUnavailable = useCallback(
    (reason: string, selector: string) => {
      if (process.env.NODE_ENV !== "production" || isOwner) {
        console.warn(`[tour] ${reason}, skipping step: ${step.id} (${selector})`);
      }
      setDebugInfo({
        selector,
        found: false,
        reason,
        rect: null,
      });
      setStepNotice("Step unavailable - continuing");
      setResolving(false);
      clearUnavailableTimer();
      unavailableTimerRef.current = window.setTimeout(() => {
        setStepIndex((prev) => Math.min(STEPS.length - 1, prev + 1));
      }, STEP_UNAVAILABLE_TIMEOUT_MS);
    },
    [clearUnavailableTimer, isOwner, step.id],
  );

  useEffect(() => {
    let active = true;
    try {
      const localDone = window.localStorage.getItem(completionStorageKey);
      if (localDone === "1") {
        // Kept for later auto-start decisions.
      }
    } catch {
      // Ignore local storage failures.
    }

    (async () => {
      try {
        const res = await fetch("/api/tour/completion", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as {
          ok?: boolean;
          state?: { completed?: boolean };
        };
        if (!active) return;
        const done = Boolean(payload.state?.completed);
        try {
          window.localStorage.setItem(completionStorageKey, done ? "1" : "0");
        } catch {
          // Ignore local storage failures.
        }
      } finally {
        if (active) setLoadedState(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [completionStorageKey]);

  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<{ force?: boolean }>).detail;
      if (detail?.force === false) {
        return;
      }
      startFlow("manual");
    };
    window.addEventListener("vsm:tour:start", onStart as EventListener);
    return () => window.removeEventListener("vsm:tour:start", onStart as EventListener);
  }, [startFlow]);

  useEffect(() => {
    if (!loadedState) return;
    const mode = searchParams.get("tour");
    if (mode !== "welcome") return;
    startFlow("welcome");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("tour");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [loadedState, pathname, router, searchParams, startFlow]);

  useEffect(() => {
    if (phase !== "tour") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipTour();
        return;
      }
      if (event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext, phase, skipTour]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!stepNotice) return;
    const timer = window.setTimeout(() => setStepNotice(null), STEP_UNAVAILABLE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [stepNotice]);

  useEffect(() => {
    if (phase !== "tour") return;
    let cancelled = false;
    clearUnavailableTimer();
    setStepNotice(null);
    setDebugInfo({
      selector: step.selector ?? null,
      found: false,
      reason: "resolving",
      rect: null,
    });

    const run = async () => {
      setResolving(false);
      targetRef.current = null;

      if (step.route) {
        const targetRoute = normalizeRouteForCompare(step.route);
        if (currentRoute !== targetRoute) {
          setResolving(true);
          setDebugInfo({
            selector: step.selector ?? null,
            found: false,
            reason: "navigating",
            rect: null,
          });
          router.push(step.route);
          return;
        }
      }

      if (!step.selector) {
        setFocusRect(null);
        setDebugInfo({
          selector: null,
          found: false,
          reason: "step_without_selector",
          rect: null,
        });
        return;
      }

      setResolving(true);
      const found = await waitForSelector(step.selector, 4200);
      if (cancelled) return;

      if (!found) {
        markStepUnavailable("selector_not_found", step.selector);
        return;
      }

      const rect = await measureTargetRect(found);
      if (cancelled) return;

      if (!rect) {
        markStepUnavailable("invalid_rect", step.selector);
        return;
      }

      targetRef.current = found;
      applyFocusRect(rect, { force: true, lock: true });
      setDebugInfo({
        selector: step.selector,
        found: true,
        reason: "ok",
        rect,
      });
      setResolving(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    applyFocusRect,
    clearUnavailableTimer,
    currentRoute,
    markStepUnavailable,
    phase,
    router,
    step.route,
    step.selector,
  ]);

  useEffect(() => {
    const selector = step.selector;
    if (phase !== "tour" || !selector) return;

    let raf = 0;
    let disposed = false;

    const updateRect = async () => {
      const now = Date.now();
      if (now - lastRemeasureAtRef.current < REMEASURE_THROTTLE_MS) {
        return;
      }
      lastRemeasureAtRef.current = now;

      const currentTarget = targetRef.current;
      let target = currentTarget;

      if (!target || !target.isConnected) {
        const reFound = document.querySelector(selector);
        if (reFound instanceof HTMLElement) {
          target = reFound;
          targetRef.current = reFound;
        }
      }

      if (!target) {
        setDebugInfo((prev) => ({
          ...prev,
          selector,
          found: false,
          reason: "target_disconnected",
        }));
        return;
      }

      const nextRect = await measureTargetRect(target, { allowScroll: false, attempts: 2 });
      if (disposed) return;

      if (!nextRect) {
        setDebugInfo((prev) => ({
          ...prev,
          selector,
          found: true,
          reason: "invalid_rect_remeasure",
          rect: null,
        }));
        return;
      }

      const applied = applyFocusRect(nextRect);
      if (applied) {
        setDebugInfo((prev) => ({
          ...prev,
          selector,
          found: true,
          reason: "ok",
          rect: nextRect,
        }));
      }
    };

    const scheduleUpdate = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        void updateRect();
      });
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    window.addEventListener("pointerup", scheduleUpdate, true);
    window.addEventListener("transitionend", scheduleUpdate, true);
    window.addEventListener("vsm:layout:changed", scheduleUpdate as EventListener);
    const interval = window.setInterval(scheduleUpdate, 140);

    const observer = new ResizeObserver(() => scheduleUpdate());
    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      disposed = true;
      if (raf) window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("pointerup", scheduleUpdate, true);
      window.removeEventListener("transitionend", scheduleUpdate, true);
      window.removeEventListener("vsm:layout:changed", scheduleUpdate as EventListener);
      window.clearInterval(interval);
    };
  }, [applyFocusRect, phase, step.selector]);

  return (
    <>
      <AnimatePresence>
        {phase === "tour" ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {focusRect ? (
              <motion.div
                key={`${step.id}-focus`}
                className="pointer-events-none fixed rounded-[16px] border border-white/75"
                initial={false}
                animate={{
                  left: Math.max(6, focusRect.left - FOCUS_PADDING),
                  top: Math.max(6, focusRect.top - FOCUS_PADDING),
                  width: Math.max(20, focusRect.width + FOCUS_PADDING * 2),
                  height: Math.max(20, focusRect.height + FOCUS_PADDING * 2),
                  boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.58)",
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            ) : (
              <div className="pointer-events-none fixed inset-0 bg-[rgba(2,6,23,0.56)]" />
            )}

            <div className="pointer-events-auto fixed right-3 top-3 z-[72]">
              <Button type="button" variant="outline" onClick={skipTour}>
                Skip
              </Button>
            </div>

            {(process.env.NODE_ENV !== "production" || isOwner) && debugEnabled ? (
              <div className="pointer-events-none fixed left-3 top-3 z-[71] max-w-[360px] rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/95 px-3 py-2 text-[11px] text-[color:var(--text-main)] shadow-[var(--window-shadow)]">
                <p className="font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Spotlight Debug
                </p>
                <p className="mt-1 truncate">Selector: {debugInfo.selector ?? "-"}</p>
                <p>Found: {debugInfo.found ? "yes" : "no"}</p>
                <p>Reason: {debugInfo.reason}</p>
                <p>
                  Rect:{" "}
                  {debugInfo.rect
                    ? `${Math.round(debugInfo.rect.left)}, ${Math.round(debugInfo.rect.top)} ${Math.round(debugInfo.rect.width)}x${Math.round(debugInfo.rect.height)}`
                    : "-"}
                </p>
              </div>
            ) : null}

            <div className="pointer-events-auto fixed bottom-4 right-4 z-[72] w-[min(380px,calc(100vw-24px))] rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-strong)]/98 p-4 shadow-[var(--window-shadow)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                Guided Tour
              </p>
              <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-[color:var(--text-main)]">
                {step.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-muted)]">
                {step.body}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {STEPS.map((tourStep, idx) => (
                    <span
                      key={tourStep.id}
                      className={cn(
                        "h-1.5 w-5 rounded-full",
                        idx === stepIndex
                          ? "bg-[var(--accent)]"
                          : "bg-black/[0.18] dark:bg-white/[0.24]",
                      )}
                    />
                  ))}
                  <span className="ml-1 text-[11px] text-[color:var(--text-muted)]">
                    {progressText}
                  </span>
                </div>
                {resolving ? (
                  <span className="text-[11px] text-[color:var(--text-muted)]">
                    Loading step...
                  </span>
                ) : null}
                {!resolving && stepNotice ? (
                  <span className="text-[11px] text-amber-300">{stepNotice}</span>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-[11px] text-[color:var(--text-muted)]">Esc skip</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={goNext}>
                    {stepIndex >= STEPS.length - 1 ? "Finish" : "Next"}
                  </Button>
                  {process.env.NODE_ENV !== "production" || isOwner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDebugEnabled((prev) => !prev)}
                    >
                      {debugEnabled ? "Debug on" : "Debug"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
                Esc skip, Enter next, Left/Right navigate.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key="tour-toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed right-3 top-3 z-[72] rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-[13px] text-[color:var(--text-main)] shadow-[var(--window-shadow)]"
          >
            {toast}
            {source === "welcome" ? (
              <span className="ml-2 text-[11px] text-[color:var(--text-muted)]">Onboarding</span>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
