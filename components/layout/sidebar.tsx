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
  Sparkles,
  BellRing,
  LayoutTemplate,
  Scale,
  Archive,
  Briefcase,
  Brain,
  Eye,
  TrendingUp,
  Cpu,
  Webhook,
  FlaskConical,
  IdCard,
  GraduationCap,
  BarChart3,
  ListChecks,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/security/permissions";
import { ROLE_PRIORITY } from "@/lib/permissions";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string, scope: string | null) => boolean;
  requiredPermission?: Permission;
  minRolePriority?: number;
  badge?: string;
};

type NavGroup = {
  id: string;
  section: "everyday" | "ops" | "advanced" | "sensitive";
  label: string;
  items: NavItem[];
  defaultCollapsed?: boolean;
};

const GROUP_STATE_KEY = "ess.sidebar.groups.v1";
const COMPACT_KEY = "ess.sidebar.compact.v1";
const SECTION_ORDER = ["everyday", "ops", "advanced", "sensitive"] as const;
const SECTION_LABEL: Record<(typeof SECTION_ORDER)[number], string> = {
  everyday: "Everyday",
  ops: "Operations",
  advanced: "Advanced",
  sensitive: "Sensitive",
};

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
    section: "everyday",
    label: "Core",
    items: [
      {
        href: "/app/dashboard",
        label: "Dashboard",
        icon: Shield,
        isActive: (p) => isPath(p, "/app/dashboard"),
        requiredPermission: "players:read",
      },
      {
        href: "/app/inbox",
        label: "Inbox",
        icon: Inbox,
        isActive: (p) => isPath(p, "/app/inbox"),
        requiredPermission: "reports:triage",
      },
      {
        href: "/app/control",
        label: "Control",
        icon: AppWindowMac,
        isActive: (p) => isPath(p, "/app/control"),
        requiredPermission: "commands:run",
      },
      {
        href: "/app/demo-checklist",
        label: "Demo Checklist",
        icon: ListChecks,
        isActive: (p) => isPath(p, "/app/demo-checklist"),
        minRolePriority: ROLE_PRIORITY.OWNER,
      },
    ],
  },
  {
    id: "moderation",
    section: "everyday",
    label: "Moderation",
    items: [
      {
        href: "/app/moderation",
        label: "Moderation Desk",
        icon: ClipboardList,
        isActive: (p) => isPath(p, "/app/moderation"),
        requiredPermission: "reports:read",
      },
      {
        href: "/app/reports",
        label: "Reports",
        icon: Flag,
        isActive: (p) => isPath(p, "/app/reports"),
        requiredPermission: "reports:read",
      },
      {
        href: "/app/cases",
        label: "Cases",
        icon: FolderKanban,
        isActive: (p) => startsWithPath(p, "/app/cases"),
        requiredPermission: "cases:read",
      },
      {
        href: "/app/players",
        label: "Players",
        icon: Users,
        isActive: (p) => startsWithPath(p, "/app/players"),
        requiredPermission: "players:read",
      },
      {
        href: "/app/actions?scope=bans",
        label: "Bans",
        icon: Ban,
        isActive: (p, s) => isPath(p, "/app/actions") && s === "bans",
        requiredPermission: "bans:create",
      },
      {
        href: "/app/actions",
        label: "Actions",
        icon: Gavel,
        isActive: (p, s) => isPath(p, "/app/actions") && s !== "bans",
        requiredPermission: "actions:create",
      },
      {
        href: "/app/commands",
        label: "Commands",
        icon: Command,
        isActive: (p) => isPath(p, "/app/commands"),
        requiredPermission: "commands:run",
      },
    ],
  },
  {
    id: "operations",
    section: "ops",
    label: "Operations",
    items: [
      {
        href: "/app/dispatch",
        label: "Dispatch",
        icon: Radio,
        isActive: (p) => startsWithPath(p, "/app/dispatch"),
        requiredPermission: "dispatch:read",
      },
      {
        href: "/app/analytics",
        label: "Analytics",
        icon: Activity,
        isActive: (p) => isPath(p, "/app/analytics"),
        requiredPermission: "players:read",
      },
    ],
  },
  {
    id: "platform",
    section: "advanced",
    label: "Platform",
    defaultCollapsed: true,
    items: [
      {
        href: "/app/platform/automation",
        label: "Automation",
        icon: Sparkles,
        isActive: (p) => startsWithPath(p, "/app/platform/automation"),
        requiredPermission: "players:read",
        badge: "Soon",
      },
      {
        href: "/app/platform/notifications",
        label: "Notifications",
        icon: BellRing,
        isActive: (p) => startsWithPath(p, "/app/platform/notifications"),
        requiredPermission: "players:read",
        badge: "Stub",
      },
      {
        href: "/app/platform/templates",
        label: "Templates",
        icon: LayoutTemplate,
        isActive: (p) => startsWithPath(p, "/app/platform/templates"),
        requiredPermission: "players:read",
        badge: "Soon",
      },
    ],
  },
  {
    id: "compliance",
    section: "advanced",
    label: "Compliance",
    defaultCollapsed: true,
    items: [
      {
        href: "/app/compliance/data-policy",
        label: "Data Policy",
        icon: Scale,
        isActive: (p) => startsWithPath(p, "/app/compliance/data-policy"),
        requiredPermission: "security:read",
      },
      {
        href: "/app/compliance/retention",
        label: "Retention",
        icon: Archive,
        isActive: (p) => startsWithPath(p, "/app/compliance/retention"),
        requiredPermission: "security:read",
        badge: "Soon",
      },
      {
        href: "/app/compliance/evidence-locker",
        label: "Evidence Locker",
        icon: Briefcase,
        isActive: (p) => startsWithPath(p, "/app/compliance/evidence-locker"),
        requiredPermission: "security:read",
        badge: "Soon",
      },
    ],
  },
  {
    id: "intelligence",
    section: "advanced",
    label: "Intelligence",
    defaultCollapsed: true,
    items: [
      {
        href: "/app/intelligence/risk-scoring",
        label: "Risk Scoring",
        icon: Brain,
        isActive: (p) => startsWithPath(p, "/app/intelligence/risk-scoring"),
        requiredPermission: "security:read",
        badge: "Soon",
      },
      {
        href: "/app/intelligence/watchlist",
        label: "Watchlist",
        icon: Eye,
        isActive: (p) => startsWithPath(p, "/app/intelligence/watchlist"),
        requiredPermission: "security:read",
        badge: "Soon",
      },
      {
        href: "/app/intelligence/trends",
        label: "Trends",
        icon: TrendingUp,
        isActive: (p) => startsWithPath(p, "/app/intelligence/trends"),
        requiredPermission: "security:read",
        badge: "Soon",
      },
    ],
  },
  {
    id: "people",
    section: "advanced",
    label: "People",
    defaultCollapsed: true,
    items: [
      {
        href: "/app/people/staff-directory",
        label: "Staff Directory",
        icon: IdCard,
        isActive: (p) => startsWithPath(p, "/app/people/staff-directory"),
        requiredPermission: "players:read",
        badge: "Soon",
      },
      {
        href: "/app/people/training-logs",
        label: "Training Logs",
        icon: GraduationCap,
        isActive: (p) => startsWithPath(p, "/app/people/training-logs"),
        requiredPermission: "players:read",
        badge: "Soon",
      },
      {
        href: "/app/people/performance",
        label: "Performance",
        icon: BarChart3,
        isActive: (p) => startsWithPath(p, "/app/people/performance"),
        requiredPermission: "players:read",
        badge: "Soon",
      },
    ],
  },
  {
    id: "security",
    section: "sensitive",
    label: "Security",
    items: [
      {
        href: "/app/security",
        label: "SOC",
        icon: ShieldCheck,
        isActive: (p) => isPath(p, "/app/security"),
        requiredPermission: "security:read",
      },
      {
        href: "/app/audit",
        label: "Audit",
        icon: ScrollText,
        isActive: (p) => isPath(p, "/app/audit"),
        requiredPermission: "audit:read",
      },
      {
        href: "/app/status",
        label: "Status",
        icon: Server,
        isActive: (p) => isPath(p, "/app/status"),
        requiredPermission: "security:read",
      },
    ],
  },
  {
    id: "admin",
    section: "sensitive",
    label: "Admin",
    defaultCollapsed: false,
    items: [
      {
        href: "/app/settings",
        label: "Settings",
        icon: Settings,
        isActive: (p) => isPath(p, "/app/settings"),
        requiredPermission: "settings:edit",
      },
      {
        href: "/app/settings/roles",
        label: "Roles",
        icon: UserCog,
        isActive: (p) => startsWithPath(p, "/app/settings/roles"),
        requiredPermission: "users:edit_role",
      },
      {
        href: "/app/settings/invites",
        label: "Invites",
        icon: Ticket,
        isActive: (p) => startsWithPath(p, "/app/settings/invites"),
        requiredPermission: "users:invite",
      },
      {
        href: "/app/settings/integrations",
        label: "Integrations",
        icon: Plug,
        isActive: (p) => startsWithPath(p, "/app/settings/integrations"),
        requiredPermission: "settings:edit",
      },
      ...(process.env.NODE_ENV !== "production"
        ? [
            {
              href: "/app/dev/diagnostics",
              label: "Diagnostics",
              icon: Activity,
              isActive: (p: string) => startsWithPath(p, "/app/dev/diagnostics"),
              requiredPermission: "audit:read" as Permission,
              minRolePriority: ROLE_PRIORITY.OWNER,
            },
          ]
        : []),
    ],
  },
  {
    id: "developer",
    section: "sensitive",
    label: "Developer",
    defaultCollapsed: true,
    items: [
      {
        href: "/app/developer/api-keys",
        label: "API Keys",
        icon: Cpu,
        isActive: (p) => startsWithPath(p, "/app/developer/api-keys"),
        requiredPermission: "api_keys:manage",
      },
      {
        href: "/app/developer/webhooks",
        label: "Webhooks",
        icon: Webhook,
        isActive: (p) => startsWithPath(p, "/app/developer/webhooks"),
        requiredPermission: "api_keys:manage",
        badge: "Soon",
      },
      {
        href: "/app/developer/sandbox",
        label: "Sandbox",
        icon: FlaskConical,
        isActive: (p) => startsWithPath(p, "/app/developer/sandbox"),
        requiredPermission: "api_keys:manage",
      },
    ],
  },
];

export function Sidebar({
  permissions,
  rolePriority,
}: {
  permissions: readonly Permission[];
  rolePriority: number;
}) {
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
  const visibleGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.requiredPermission && !permissions.includes(item.requiredPermission)) {
            return false;
          }
          if (item.minRolePriority && rolePriority < item.minRolePriority) {
            return false;
          }
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [permissions, rolePriority]);

  const visibleSections = useMemo(
    () =>
      SECTION_ORDER.map((section) => ({
        section,
        label: SECTION_LABEL[section],
        groups: visibleGroups.filter((group) => group.section === section),
      })).filter((entry) => entry.groups.length > 0),
    [visibleGroups],
  );

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
        {visibleSections.map((section, sectionIndex) => (
          <div
            key={section.section}
            className={cn(
              "space-y-2",
              sectionIndex > 0 && "border-t border-[color:var(--border)] pt-2.5",
            )}
          >
            <p
              className={cn(
                "px-2 text-[8px] font-medium uppercase tracking-[0.14em] text-[color:var(--text-muted)]/70",
                compact && "sr-only",
              )}
            >
              {section.label}
            </p>

            {section.groups.map((group) => {
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
                              {item.badge && !compact ? (
                                <span className="ml-auto rounded-full border border-[color:var(--border)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[color:var(--text-muted)]">
                                  {item.badge}
                                </span>
                              ) : null}
                            </Link>
                          );
                        })}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
