import { cn } from "@/lib/utils";

interface MacWindowProps {
  title?: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function MacWindow({
  title,
  subtitle,
  className,
  contentClassName,
  children,
}: MacWindowProps) {
  return (
    <section
      className={cn(
        "ui-transition rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--panel-shadow)] backdrop-blur-lg",
        className,
      )}
    >
      {(title || subtitle) && (
        <header className="border-b border-[color:var(--border)] px-3 py-2">
          {title ? (
            <h2 className="text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{subtitle}</p>
          ) : null}
        </header>
      )}
      <div className={cn("p-3", contentClassName)}>{children}</div>
    </section>
  );
}
