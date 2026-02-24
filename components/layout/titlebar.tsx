"use client";

import Link from "next/link";
import { AppWindowMac, CircleUserRound, HelpCircle } from "lucide-react";

import { logoutAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandBar } from "@/components/commands/command-bar";
import { CommunitySwitcher } from "@/components/layout/community-switcher";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SensitiveModeToggle } from "@/components/security/sensitive-mode-toggle";

interface TitleBarProps {
  title: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  community: { id: string; name: string; slug: string };
  communities: Array<{
    id: string;
    name: string;
    slug: string;
    roleName: string;
    rolePriority: number;
  }>;
}

export function TitleBar({ title, user, community, communities }: TitleBarProps) {
  const controls = [
    { label: "Close window", color: "#ff5f57" },
    { label: "Minimize window", color: "#febc2e" },
    { label: "Zoom window", color: "#28c840" },
  ];

  return (
    <header className="ui-transition sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--titlebar-bg)] px-3 py-1.5 backdrop-blur-lg lg:px-4">
      <div className="relative flex items-center gap-2">
        <div aria-hidden className="hidden items-center gap-1.5 lg:flex">
          {controls.map((control) => (
            <span
              key={control.label}
              className="ui-transition group relative h-3.5 w-3.5 rounded-full border border-black/20 hover:scale-105"
              style={{ backgroundColor: control.color }}
            >
              <span className="pointer-events-none absolute inset-0 rounded-full bg-white/30 opacity-0 group-hover:opacity-100" />
            </span>
          ))}
        </div>

        <p className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 text-[13px] font-semibold tracking-tight text-[color:var(--text-main)] lg:block">
          {title}
        </p>

        <div className="min-w-0 flex-1">
          <CommandBar />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <CommunitySwitcher community={community} communities={communities} />
          <div className="flex items-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)]/65 px-0.5">
            <NotificationsMenu />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Help and tips">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Help</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/docs">Quick docs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs#shortcuts">Keyboard shortcuts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/moderation">Moderation Desk quick start</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings/access-keys">Access keys guide</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/dispatch?map=1">Dispatch map tips</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/security">Security checklist</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Profile menu">
                <CircleUserRound className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-[color:var(--text-muted)]">{user.email}</p>
                <p className="text-xs text-[color:var(--text-muted)]">Role: {user.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/profile?tab=security">Sessions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/download">
                  <AppWindowMac className="h-4 w-4" />
                  Download desktop
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-1 py-1">
                <SensitiveModeToggle variant="menu" />
              </div>
              <DropdownMenuSeparator />
              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="ui-transition w-full rounded-md px-2 py-1.5 text-left text-sm text-rose-600 outline-none hover:bg-rose-500/10 dark:text-rose-300"
                >
                  Sign out
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
