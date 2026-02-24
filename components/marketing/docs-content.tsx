import { cn } from "@/lib/utils";

export function DocsArticle({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-6">
      <header className="max-w-[56ch]">
        <h1 className="text-[clamp(1.7rem,3vw,2.25rem)] font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/66">{intro}</p>
      </header>
      <div className="space-y-3">{children}</div>
    </article>
  );
}

export function DocsSection({
  id,
  title,
  children,
  className,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[16px] border border-white/10 bg-white/[0.04] p-4 md:p-5",
        className,
      )}
    >
      <h2 className="text-[14px] font-semibold tracking-[0.01em] text-white/92">{title}</h2>
      <div className="mt-2 text-[13px] leading-relaxed text-white/66">{children}</div>
    </section>
  );
}

export function DocsCallout({
  tone = "note",
  children,
}: {
  tone?: "note" | "warning";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border px-3 py-2 text-[12px] leading-relaxed",
        tone === "warning"
          ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
          : "border-sky-300/24 bg-sky-300/10 text-sky-100",
      )}
    >
      {children}
    </div>
  );
}

export function DocsCode({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-[12px] border border-white/10 bg-black/28 p-3 text-[12px] text-white/84">
      {children}
    </pre>
  );
}
