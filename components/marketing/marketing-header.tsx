"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/features", label: "Features", match: (p: string) => p === "/features" },
  { href: "/download", label: "Download", match: (p: string) => p === "/download" },
  { href: "/docs", label: "Docs", match: (p: string) => p === "/docs" || p.startsWith("/docs/") },
  { href: "/credits", label: "Credits", match: (p: string) => p === "/credits" },
] as const;

export function MarketingHeader({
  isAuthed,
  variant = "default",
}: {
  isAuthed: boolean;
  variant?: "default" | "minimal";
}) {
  if (variant === "minimal") {
    return <MinimalMarketingHeader isAuthed={isAuthed} />;
  }

  return <DefaultMarketingHeader isAuthed={isAuthed} />;
}

function MinimalMarketingHeader({ isAuthed }: { isAuthed: boolean }) {
  const cta = useMemo(
    () => ({
      href: isAuthed ? "/app" : "/login",
      label: isAuthed ? "Enter Vanguard" : "Login",
    }),
    [isAuthed],
  );

  return (
    <header className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[72px] bg-[linear-gradient(180deg,rgba(7,9,16,0.66)_0%,rgba(7,9,16,0.3)_52%,transparent_100%)]" />
      <div className="relative border-b border-white/5 bg-black/10 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[78rem] items-center justify-between px-6 py-2.5 lg:px-8">
          <Link href="/" className="inline-flex min-w-0 items-center">
            <span className="truncate text-[12px] font-medium tracking-[0.02em] text-white/84">
              Vanguard
            </span>
          </Link>
          <Link
            href={cta.href}
            className="ui-transition pr-0.5 text-[12.5px] font-normal tracking-[0.01em] text-white/58 hover:text-white/88"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </header>
  );
}

function DefaultMarketingHeader({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();
  const cta = useMemo(
    () => ({
      href: isAuthed ? "/app" : "/login",
      label: isAuthed ? "Open Dashboard" : "Sign in",
    }),
    [isAuthed],
  );

  // Landing page includes the primary auth CTA in the hero. Hide the header CTA while the
  // hero is visible so we never show two "Sign in/Open Dashboard" buttons at once.
  const [hideHeaderCta, setHideHeaderCta] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setHideHeaderCta(false);
      return;
    }

    const hero = document.getElementById("marketing-hero");
    if (!hero || typeof IntersectionObserver === "undefined") {
      setHideHeaderCta(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideHeaderCta(Boolean(entry?.isIntersecting));
      },
      {
        root: null,
        threshold: 0.42,
        // Account for sticky header height so we hide CTA until the hero is meaningfully out of view.
        rootMargin: "-72px 0px 0px 0px",
      },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[88px] bg-[linear-gradient(180deg,rgba(10,10,12,0.78)_0%,rgba(10,10,12,0.42)_55%,transparent_100%)]" />
      <div className="relative border-b border-white/5 bg-black/15 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-[78rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2.5">
          <Link href="/" className="group inline-flex min-w-0 items-center">
            <span className="truncate text-[13px] font-semibold tracking-tight text-white/90 group-hover:text-white">
              Vanguard Security &amp; Management
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-6 text-[13px] md:flex">
            {NAV_LINKS.map((item) => (
              <HeaderNavLink
                key={item.href}
                href={item.href}
                active={item.match(pathname)}
              >
                {item.label}
              </HeaderNavLink>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <div
              className={cn(
                "transition-opacity duration-200 ease-out",
                hideHeaderCta ? "pointer-events-none opacity-0" : "opacity-100",
              )}
              aria-hidden={hideHeaderCta ? "true" : undefined}
            >
              <Link
                href={cta.href}
                className="mkt-btn mkt-btn-secondary mkt-btn-sm"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "ui-transition rounded-full px-3 py-1.5 font-medium",
        active ? "text-white" : "text-white/65 hover:text-white",
      )}
    >
      {children}
    </Link>
  );
}
