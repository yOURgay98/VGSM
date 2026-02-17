"use client";

import clsx from "clsx";
import { animate, motion } from "framer-motion";
import { Search, Settings2, Share2 } from "lucide-react";
import { useMotionValue } from "framer-motion";

import type { GlassLevel } from "@/lib/config";
import { useMediaQuery } from "@/lib/hooks";

interface MacWindowProps {
  title: string;
  glassLevel: GlassLevel;
  spotlightQuery: string;
  onSpotlightQueryChange: (value: string) => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  draggable: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}

const glassClassByLevel: Record<GlassLevel, string> = {
  low: "bg-white/55 dark:bg-black/35 backdrop-blur-md",
  med: "bg-white/60 dark:bg-black/38 backdrop-blur-xl",
  high: "bg-white/65 dark:bg-black/42 backdrop-blur-2xl",
};

export function MacWindow({
  title,
  glassLevel,
  spotlightQuery,
  onSpotlightQueryChange,
  onOpenSettings,
  onOpenShare,
  draggable,
  reducedMotion,
  children,
}: MacWindowProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const canDrag = draggable && isDesktop;

  return (
    <motion.section
      drag={canDrag && !reducedMotion}
      dragElastic={0.14}
      dragMomentum={false}
      style={{ x, y }}
      onDragEnd={() => {
        if (reducedMotion) {
          x.set(0);
          y.set(0);
          return;
        }

        animate(x, 0, { type: "spring", stiffness: 260, damping: 28 });
        animate(y, 0, { type: "spring", stiffness: 260, damping: 28 });
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
      className={clsx(
        "w-full max-w-5xl rounded-[30px] border border-[var(--soft-border)] shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)]",
        glassClassByLevel[glassLevel],
      )}
    >
      <div className="flex items-center gap-3 border-b border-[var(--soft-border)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#FEBB2E]" aria-hidden />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" aria-hidden />
        </div>

        <p className="hidden flex-1 text-center text-sm font-medium text-[var(--text-muted)] sm:block">
          {title}
        </p>

        <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:flex-1 sm:justify-end">
          <button
            type="button"
            onClick={onOpenShare}
            className="mac-button"
            aria-label="Open share sheet"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mac-button"
            aria-label="Open settings"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <div className="border-b border-[var(--soft-border)] px-4 py-3 sm:px-5">
        <label htmlFor="spotlight" className="sr-only">
          Filter links and highlights
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--soft-border)] bg-white/50 px-3 py-2 text-sm shadow-sm dark:bg-black/30">
          <Search className="h-4 w-4 text-[var(--text-muted)]" />
          <input
            id="spotlight"
            type="search"
            value={spotlightQuery}
            onChange={(event) => onSpotlightQueryChange(event.target.value)}
            placeholder="Spotlight search"
            className="w-full bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">{children}</div>
    </motion.section>
  );
}
