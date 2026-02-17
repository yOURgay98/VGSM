interface AboutCardProps {
  text: string;
  tags: string[];
}

export function AboutCard({ text, tags }: AboutCardProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-[var(--soft-border)] bg-white/45 p-4 shadow-sm dark:bg-black/25">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        About
      </h2>
      <p className="text-sm leading-6 text-[var(--text-main)]/90">{text}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[var(--soft-border)] bg-white/65 px-3 py-1 text-xs font-medium text-[var(--text-main)] dark:bg-black/30"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}
