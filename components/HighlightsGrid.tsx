import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { HighlightItem } from "@/lib/config";
import { getHighlightIcon } from "@/lib/icons";

interface HighlightsGridProps {
  highlights: HighlightItem[];
  reducedMotion: boolean;
}

export function HighlightsGrid({ highlights, reducedMotion }: HighlightsGridProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        Highlights
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {highlights.map((item, index) => {
          const Icon = getHighlightIcon(item.icon);

          return (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              whileHover={reducedMotion ? undefined : { y: -3 }}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.2,
                      delay: Math.min(index, 6) * 0.04,
                      ease: "easeOut",
                    }
              }
              className="group rounded-2xl border border-[var(--soft-border)] bg-white/45 p-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:bg-black/25"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--accent)_15%,white)] text-[var(--accent)] dark:bg-[color:color-mix(in_srgb,var(--accent)_20%,black)]">
                  <Icon className="h-4 w-4" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--text-main)]">{item.title}</p>
            </motion.a>
          );
        })}
      </div>

      {highlights.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--soft-border)] bg-white/20 px-3 py-4 text-sm text-[var(--text-muted)] dark:bg-black/15">
          No highlights match the current Spotlight query.
        </p>
      ) : null}
    </section>
  );
}
