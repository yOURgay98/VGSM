"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { TwoFactorSettings } from "@/components/forms/two-factor-settings";
import { SessionManager } from "@/components/forms/session-manager";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SegmentedControl } from "@/components/ui/segmented-control";

type ProfileTab = "account" | "security" | "activity";

const tabOptions: Array<{ value: ProfileTab; label: string }> = [
  { value: "account", label: "Account" },
  { value: "security", label: "Security" },
  { value: "activity", label: "Activity" },
];

export function ProfileTabs({
  initialTab,
  user,
  activity,
  sessions,
  notice,
  securityRequirements,
  actionsEnabled,
}: {
  initialTab?: ProfileTab;
  user: {
    id?: string | null;
    name: string;
    email: string;
    roleLabel: string;
    roleVariant: "default" | "success" | "warning" | "danger" | "info";
    disabled: boolean;
    twoFactorEnabled: boolean;
    createdAtLabel: string;
    lastLoginAtLabel: string;
    lockedUntilLabel: string | null;
  };
  activity: Array<{
    id: string;
    createdAtLabel: string;
    eventType: string;
    metadata: string | null;
  }>;
  sessions: Array<{
    sessionToken: string;
    current: boolean;
    createdAtLabel: string;
    lastActiveAtLabel: string;
    expiresAtLabel: string;
    ip: string | null;
    userAgent: string | null;
  }>;
  notice: string | null;
  securityRequirements?: Array<{
    id: "password" | "2fa";
    title: string;
    description: string;
  }>;
  actionsEnabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<ProfileTab>(() => initialTab ?? "account");
  const reducedMotion = useReducedMotion();
  const auditHref = useMemo(() => {
    if (!user.id) {
      return "/app/audit";
    }
    const params = new URLSearchParams({ userId: user.id });
    return `/app/audit?${params.toString()}`;
  }, [user.id]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          ariaLabel="Profile sections"
          value={tab}
          onChange={(next) => {
            const nextTab = next as ProfileTab;
            setTab(nextTab);
            const params = new URLSearchParams(searchParams);
            params.set("tab", nextTab);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          options={tabOptions}
        />
        <Badge variant={user.roleVariant}>{user.roleLabel}</Badge>
      </div>

      {securityRequirements && securityRequirements.length ? (
        <div className="rounded-[var(--radius-panel)] border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-3 py-2">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--danger)]"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-tight text-[color:var(--text-main)]">
                Action required
              </p>
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                Complete the items below to unlock the rest of the dashboard.
              </p>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {securityRequirements.map((req) => (
              <div
                key={req.id}
                className="rounded-[12px] border border-[color:var(--danger-border)] bg-[color:var(--surface-strong)] px-3 py-2"
              >
                <p className="text-[13px] font-medium text-[color:var(--text-main)]">{req.title}</p>
                <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{req.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[13px] text-[color:var(--text-muted)]">
          {notice}
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        >
          {tab === "account" ? (
            <AccountPanel user={user} />
          ) : tab === "security" ? (
            <SecurityPanel
              actionsEnabled={actionsEnabled}
              twoFactorEnabled={user.twoFactorEnabled}
              sessions={sessions}
              highlightPassword={Boolean(securityRequirements?.some((r) => r.id === "password"))}
              highlightTwoFactor={Boolean(securityRequirements?.some((r) => r.id === "2fa"))}
            />
          ) : (
            <ActivityPanel activity={activity} auditHref={auditHref} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PanelShell({
  title,
  children,
  required,
}: {
  title: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <section
      className={`rounded-[var(--radius-panel)] border p-3 shadow-[var(--panel-shadow)] ${
        required
          ? "border-[color:var(--danger-border)] bg-[color:color-mix(in srgb, var(--danger) 8%, var(--surface-muted))]"
          : "border-[color:var(--border)] bg-[color:var(--surface-muted)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
          {title}
        </p>
        {required ? (
          <span className="rounded-full border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--danger)]">
            Required
          </span>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function AccountPanel({
  user,
}: {
  user: {
    name: string;
    email: string;
    roleLabel: string;
    disabled: boolean;
    lockedUntilLabel: string | null;
    createdAtLabel: string;
    lastLoginAtLabel: string;
  };
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <PanelShell title="Account Info">
        <h3 className="text-base font-semibold tracking-tight text-[color:var(--text-main)]">
          {user.name}
        </h3>
        <p className="mt-0.5 text-[13px] text-[color:var(--text-muted)]">{user.email}</p>
      </PanelShell>

      <PanelShell title="Metadata">
        <dl className="grid gap-2 text-[13px]">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[color:var(--text-muted)]">Status</dt>
            <dd className="text-[color:var(--text-main)]">
              {user.disabled
                ? "Disabled"
                : user.lockedUntilLabel
                  ? `Locked until ${user.lockedUntilLabel}`
                  : "Active"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[color:var(--text-muted)]">Role</dt>
            <dd className="text-[color:var(--text-main)]">{user.roleLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[color:var(--text-muted)]">Created</dt>
            <dd className="text-[color:var(--text-main)]">{user.createdAtLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[color:var(--text-muted)]">Last Login</dt>
            <dd className="text-[color:var(--text-main)]">{user.lastLoginAtLabel}</dd>
          </div>
        </dl>
      </PanelShell>
    </div>
  );
}

function SecurityPanel({
  actionsEnabled,
  twoFactorEnabled,
  sessions,
  highlightPassword,
  highlightTwoFactor,
}: {
  actionsEnabled: boolean;
  twoFactorEnabled: boolean;
  sessions: Array<{
    sessionToken: string;
    current: boolean;
    createdAtLabel: string;
    lastActiveAtLabel: string;
    expiresAtLabel: string;
    ip: string | null;
    userAgent: string | null;
  }>;
  highlightPassword: boolean;
  highlightTwoFactor: boolean;
}) {
  return (
    <div className="space-y-3">
      <PanelShell title="Password" required={highlightPassword}>
        {actionsEnabled ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Password changes are unavailable until your account is linked to a database user.
          </p>
        )}
      </PanelShell>

      <PanelShell title="Two-Factor Authentication" required={highlightTwoFactor}>
        <TwoFactorSettings enabled={twoFactorEnabled} actionsEnabled={actionsEnabled} />
      </PanelShell>

      <PanelShell title="Sessions">
        <SessionManager sessions={sessions} />
      </PanelShell>
    </div>
  );
}

function ActivityPanel({
  activity,
  auditHref,
}: {
  activity: Array<{
    id: string;
    createdAtLabel: string;
    eventType: string;
    metadata: string | null;
  }>;
  auditHref: string;
}) {
  return (
    <PanelShell title="Recent Activity">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[13px] text-[color:var(--text-muted)]">
          Latest audit events for this account.
        </p>
        <Link
          href={auditHref}
          className="ui-transition text-[13px] font-medium text-[color:var(--accent)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[170px]">Timestamp</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activity.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                >
                  No activity recorded.
                </TableCell>
              </TableRow>
            ) : (
              activity.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">{entry.createdAtLabel}</TableCell>
                  <TableCell>{entry.eventType}</TableCell>
                  <TableCell>
                    <code className="line-clamp-2 max-w-[360px] text-xs text-[color:var(--text-muted)]">
                      {entry.metadata ?? "-"}
                    </code>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PanelShell>
  );
}
