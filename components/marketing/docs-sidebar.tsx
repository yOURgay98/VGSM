"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOCS_NAV } from "@/components/marketing/docs-nav";
import { cn } from "@/lib/utils";

function DocsNavList() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {DOCS_NAV.map((item) => {
        const active = pathname === item.href || (pathname === "/docs" && item.href === "/docs/overview");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "ui-transition block rounded-[10px] px-3 py-2 text-[12px] tracking-[0.01em]",
              active
                ? "border border-white/14 bg-white/[0.06] text-white"
                : "border border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.03] hover:text-white/86",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DocsSidebar() {
  return (
    <>
      <div className="hidden lg:block">
        <DocsNavList />
      </div>

      <details className="rounded-[12px] border border-white/10 bg-white/[0.03] p-2 lg:hidden">
        <summary className="cursor-pointer list-none px-1 py-1 text-[12px] font-medium tracking-[0.02em] text-white/74">
          Browse docs
        </summary>
        <div className="mt-2">
          <DocsNavList />
        </div>
      </details>
    </>
  );
}
