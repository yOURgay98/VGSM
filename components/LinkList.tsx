import clsx from "clsx";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import type { LinksStyle, ProfileLink } from "@/lib/config";
import { getLinkIcon } from "@/lib/icons";

interface LinkListProps {
  links: ProfileLink[];
  style: LinksStyle;
  reducedMotion: boolean;
}

export function LinkList({ links, style, reducedMotion }: LinkListProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Links
        </h2>
        <p className="text-xs text-[var(--text-muted)]">{links.length} items</p>
      </div>

      <div className={clsx("grid gap-2", style === "expanded" ? "sm:grid-cols-2" : "grid-cols-1")}>
        {links.map((link, index) => {
          const Icon = getLinkIcon(link.icon);

          return (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              whileHover={reducedMotion ? undefined : { y: -2, scale: 1.01 }}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.22,
                      delay: Math.min(index, 5) * 0.04,
                      ease: "easeOut",
                    }
              }
              className={clsx(
                "group flex items-center justify-between rounded-2xl border border-[var(--soft-border)] bg-white/45 p-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] dark:bg-black/25",
                style === "compact" ? "py-2" : "py-3.5",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--accent)_15%,white)] text-[var(--accent)] shadow-sm dark:bg-[color:color-mix(in_srgb,var(--accent)_20%,black)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--text-main)]">
                    {link.title}
                  </span>
                  {style === "expanded" ? (
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {link.subtitle}
                    </span>
                  ) : null}
                </span>
              </div>

              <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" />
            </motion.a>
          );
        })}
      </div>

      {links.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--soft-border)] bg-white/20 px-3 py-4 text-sm text-[var(--text-muted)] dark:bg-black/15">
          No links match the current Spotlight query.
        </p>
      ) : null}
    </section>
  );
}
