"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Tab = { id: string; label: string };

const easeInOut: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function MarketingSectionTabs({
  tabs,
  className,
  sticky = true,
}: {
  tabs: Tab[];
  className?: string;
  sticky?: boolean;
}) {
  const reduced = useReducedMotion();
  const tabList = useMemo(() => tabs.filter((t) => t.id && t.label), [tabs]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [activeId, setActiveId] = useState<string>(() => tabList[0]?.id ?? "");
  const [underline, setUnderline] = useState<{ x: number; w: number }>({ x: 0, w: 0 });

  useEffect(() => {
    if (tabList.length === 0) return;

    const targets = tabList
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        const best = visible[0]?.target?.id;
        if (best) setActiveId(best);
      },
      {
        root: null,
        // Middle-of-viewport bias, with room for sticky header + this tab bar.
        rootMargin: "-40% 0px -55% 0px",
        threshold: [0.1, 0.22, 0.35, 0.5],
      },
    );

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [tabList]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const active = activeId ? tabRefs.current[activeId] : null;
    if (!container || !active) return;

    const update = () => {
      const c = container.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      setUnderline({
        x: Math.round(r.left - c.left),
        w: Math.round(r.width),
      });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(container);
    ro.observe(active);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [activeId]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      // Ignore.
    }
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  if (tabList.length === 0) return null;

  return (
    <div
      className={cn(
        sticky ? "sticky top-[72px] z-40" : "",
        "mt-8 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1.5 backdrop-blur-xl",
        className,
      )}
    >
      <div ref={containerRef} className="relative flex items-center gap-1 overflow-x-auto px-1">
        <motion.div
          aria-hidden
          className="absolute inset-y-1 left-0 rounded-full bg-white/[0.08]"
          animate={{ x: underline.x, width: underline.w }}
          transition={{
            type: "tween",
            duration: 0.2,
            ease: easeInOut,
          }}
          style={{ width: underline.w }}
        />

        {tabList.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              ref={(node) => {
                tabRefs.current[t.id] = node;
              }}
              type="button"
              onClick={() => scrollTo(t.id)}
              className={cn(
                "ui-transition relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium",
                active ? "text-white" : "text-white/70 hover:text-white",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
