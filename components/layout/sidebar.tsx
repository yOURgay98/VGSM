"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AppWindowMac,
  Activity,
  Ban,
  ChevronRight,
  Command,
  ClipboardList,
  FolderKanban,
  Inbox,
  Radio,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  Flag,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  UserCog,
  Ticket,
  Gavel,
  Server,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string, scope: string | null) => boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
  defaultCollapsed?: boolean;
};

const GROUP_STATE_KEY = "ess.sidebar.groups.v1";
const COMPACT_KEY = "ess.sidebar.compact.v1";

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isPath(pathname: string, exact: string) {
  return pathname === exact;
}

function startsWithPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function tourIdForHref(href: string): string | undefined {
  if (href === "/app/inbox") return "nav-inbox";
  if (href === "/app/moderation") return "nav-moderation";
  if (href === "/app/players") return "nav-players";
  if (href === "/app/dispatch") return "nav-dispatch";
  if (href === "/app/commands") return "nav-commands";
  if (href === "/app/security") return "nav-security";
  if (href === "/app/audit") return "nav-audit";
  return undefined;
}

const navGroups: NavGroup[] = [
  {
    id: "core",
    label: "Core",
    items: [
      {
        href: "/app/dashboard",
        label: "Dashboard",
        icon: Shield,
        isActive: (p) => isPath(p, "/app/dashboard"),
      },
      { href: "/app/inbox", label: "Inbox", icon: Inbox, isActive: (p) => isPath(p, "/app/inbox") },
      {
        href: "/app/control",
        label: "Control",
        icon: AppWindowMac,
        isActive: (p) => isPath(p, "/app/control"),
      },
    ],
  },
  {
    id: "moderation",
    label: "Moderation",
    items: [
      {
        href: "/app/moderation",
        label: "Moderation Desk",
        icon: ClipboardList,
        isActive: (p) => isPath(p, "/app/moderation"),
      },
      {
        href: "/app/players",
        label: "Players",
        icon: Users,
        isActive: (p) => startsWithPath(p, "/app/players"),
      },
      {
        href: "/app/reports",
        label: "Reports",
        icon: Flag,
        isActive: (p) => isPath(p, "/app/reports"),
      },
      {
        href: "/app/cases",
        label: "Cases",
        icon: FolderKanban,
        isActive: (p) => startsWithPath(p, "/app/cases"),
      },
      {
        href: "/app/actions?scope=bans",
        label: "Bans",
        icon: Ban,
        isActive: (p, s) => isPath(p, "/app/actions") && s === "bans",
      },
      {
        href: "/app/actions",
        label: "Actions",
        icon: Gavel,
        isActive: (p, s) => isPath(p, "/app/actions") && s !== "bans",
      },
      {
        href: "/app/commands",
        label: "Commands",
        icon: Command,
        isActive: (p) => isPath(p, "/app/commands"),
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        href: "/app/dispatch",
        label: "Dispatch",
        icon: Radio,
        isActive: (p) => startsWithPath(p, "/app/dispatch"),
      },
      {
        href: "/app/analytics",
        label: "Analytics",
        icon: Activity,
        isActive: (p) => isPath(p, "/app/analytics"),
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    items: [
      {
        href: "/app/security",
        label: "SOC",
        icon: ShieldCheck,
        isActive: (p) => isPath(p, "/app/security"),
      },
      {
        href: "/app/audit",
        label: "Audit",
        icon: ScrollText,
        isActive: (p) => isPath(p, "/app/audit"),
      },
      {
        href: "/app/status",
        label: "Status",
        icon: Server,
        isActive: (p) => isPath(p, "/app/status"),
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    defaultCollapsed: false,
    items: [
      {
        href: "/app/settings",
        label: "Settings",
        icon: Settings,
        isActive: (p) => isPath(p, "/app/settings"),
      },
      {
        href: "/app/settings/roles",
        label: "Roles",
        icon: UserCog,
        isActive: (p) => startsWithPath(p, "/app/settings/roles"),
      },
      {
        href: "/app/settings/invites",
        label: "Invites",
        icon: Ticket,
        isActive: (p) => startsWithPath(p, "/app/settings/invites"),
      },
      {
        href: "/app/settings/integrations/discord",
        label: "Integrations",
        icon: Plug,
        isActive: (p) => startsWithPath(p, "/app/settings/integrations"),
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              href: "/app/dev/diagnostics",
              label: "Diagnostics",
              icon: Activity,
              isActive: (p: string) => startsWithPath(p, "/app/dev/diagnostics"),
            },
          ]
        : []),
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope");

  const [compact, setCompact] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of navGroups) init[g.id] = Boolean(g.defaultCollapsed);
    return init;
  });

  useEffect(() => {
    try {
      const savedCompact = safeParseJson<{ compact?: boolean }>(
        window.localStorage.getItem(COMPACT_KEY),
      );
      if (typeof savedCompact?.compact === "boolean") setCompact(savedCompact.compact);
    } catch {
      // Ignore localStorage read failures.
    }

    try {
      const saved = safeParseJson<Record<string, boolean>>(
        window.localStorage.getItem(GROUP_STATE_KEY),
      );
      if (saved && typeof saved === "object") {
        setCollapsed((prev) => ({ ...prev, ...saved }));
      }
    } catch {
      // Ignore.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPACT_KEY, JSON.stringify({ compact }));
    } catch {
      // Ignore.
    }
  }, [compact]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GROUP_STATE_KEY, JSON.stringify(collapsed));
    } catch {
      // Ignore.
    }
  }, [collapsed]);

  const asideWidth = compact ? "w-[72px]" : "w-[224px]";

  const header = useMemo(() => {
    return (
      <div
        className={cn("mb-3 flex items-start justify-between gap-2 px-2 pt-0.5", compact && "px-1")}
      >
        <div className={cn("min-w-0", compact && "hidden")}>
          <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-[color:var(--text-muted)]/75">
            Vanguard Security
          </p>
          <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-[color:var(--text-main)]">
            VSM Console
          </h1>
        </div>

        <button
          type="button"
          className={cn(
            "ui-transition mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-transparent text-[color:var(--text-muted)] hover:bg-black/[0.03] hover:text-[color:var(--text-main)] dark:hover:bg-white/[0.07]",
            compact && "mx-auto",
          )}
          onClick={() => setCompact((v) => !v)}
          aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
          title={compact ? "Expand sidebar" : "Collapse sidebar"}
        >
          {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
    );
  }, [compact]);

  return (
    <aside
      className={cn(
        "ui-transition hidden shrink-0 border-r border-[color:var(--border)] bg-[color:var(--sidebar-bg)] p-2 backdrop-blur-lg lg:block",
        asideWidth,
      )}
    >
      {header}

      <nav aria-label="Primary" className={cn("space-y-3", compact && "space-y-2")}>
        {navGroups.map((group) => {
          const isCollapsed = Boolean(collapsed[group.id]);

          return (
            <div key={group.id}>
              <button
                type="button"
                className={cn(
                  "ui-transition flex h-6 w-full items-center gap-2 rounded-lg px-2 text-left text-[8px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-muted)]/72 hover:bg-black/[0.03] dark:hover:bg-white/[0.07]",
                  compact && "justify-center px-0",
                )}
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                aria-expanded={!isCollapsed}
                aria-controls={`sidebar-group-${group.id}`}
                title={compact ? group.label : undefined}
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    !isCollapsed && "rotate-90",
                  )}
                  aria-hidden
                />
                <span className={cn("truncate", compact && "sr-only")}>{group.label}</span>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed ? (
                  <motion.div
                    id={`sidebar-group-${group.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="mt-1 space-y-1 overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const active = item.isActive(pathname, scope);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          data-tour={tourIdForHref(item.href)}
                          className={cn(
                            "ui-transition group relative flex h-8 items-center gap-2 rounded-lg pl-3 pr-2 text-[13px] font-medium text-[color:var(--text-muted)] hover:bg-black/[0.03] hover:text-[color:var(--text-main)] dark:hover:bg-white/[0.07]",
                            "transition-all duration-200",
                            compact && "justify-center gap-0 px-0",
                            active &&
                              "bg-white/75 text-[color:var(--text-main)] shadow-[var(--panel-shadow)] dark:bg-white/[0.09]",
                          )}
                          title={compact ? item.label : undefined}
                        >
                          {active ? (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              aria-hidden
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent)]"
                            />
                          ) : (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--accent)] opacity-0"
                            />
                          )}
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className={cn("truncate", compact && "sr-only")}>{item.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
