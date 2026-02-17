"use client";

import { useActionState } from "react";

import { updateSecuritySettingsAction } from "@/app/actions/security-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState = { success: false, message: "" };

export function SecuritySettingsForm({
  initialValues,
  encryptionKeyConfigured,
}: {
  initialValues: {
    require2FAForPrivileged: boolean;
    twoPersonRule: boolean;
    requireSensitiveModeForHighRisk: boolean;
    sensitiveModeTtlMinutes: number;
    highRiskCommandCooldownSeconds: number;
    betaAccessEnabled: boolean;
    autoFreezeEnabled: boolean;
    autoFreezeThreshold: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    lockoutMaxAttempts: number;
    lockoutWindowMinutes: number;
    lockoutDurationMinutes: number;
  };
  encryptionKeyConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(updateSecuritySettingsAction, initialState);

  return (
    <form action={action} className="space-y-3">
      {!encryptionKeyConfigured ? (
        <div className="rounded-[var(--radius-control)] border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-800 dark:text-amber-200">
          <p className="font-medium">AUTH_ENCRYPTION_KEY is missing.</p>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">
            Two-factor enrollment requires an encryption key to store secrets safely. 2FA
            enforcement will not be applied until this is configured.
          </p>
        </div>
      ) : null}

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Require 2FA for OWNER/ADMIN
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              When enabled, privileged users must enroll before accessing secured pages.
            </p>
          </div>
          <Switch
            name="require2FAForPrivileged"
            aria-label="Require 2FA for privileged roles"
            defaultChecked={initialValues.require2FAForPrivileged}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Two-person rule for high-risk commands
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              High-risk commands create approval requests instead of executing immediately.
            </p>
          </div>
          <Switch
            name="twoPersonRule"
            aria-label="Require approval for high-risk commands"
            defaultChecked={initialValues.twoPersonRule}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Access key required for new joins (OWNER only)
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              When enabled, invite redemption requires a valid access key before a membership can be
              created.
            </p>
          </div>
          <Switch
            name="betaAccessEnabled"
            aria-label="Require access key for new joins"
            defaultChecked={initialValues.betaAccessEnabled}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Sensitive mode required for high-risk actions
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              Adds an extra confirmation step before you can request or approve high-risk commands.
            </p>
          </div>
          <Switch
            name="requireSensitiveModeForHighRisk"
            aria-label="Require sensitive mode for high-risk commands"
            defaultChecked={initialValues.requireSensitiveModeForHighRisk}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div>
          <Label htmlFor="sensitiveModeTtlMinutes">Sensitive mode timeout (minutes)</Label>
          <Input
            id="sensitiveModeTtlMinutes"
            name="sensitiveModeTtlMinutes"
            type="number"
            min={1}
            max={120}
            defaultValue={initialValues.sensitiveModeTtlMinutes}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="highRiskCommandCooldownSeconds">High-risk cooldown (seconds)</Label>
          <Input
            id="highRiskCommandCooldownSeconds"
            name="highRiskCommandCooldownSeconds"
            type="number"
            min={0}
            max={3600}
            defaultValue={initialValues.highRiskCommandCooldownSeconds}
            className="mt-1"
            required
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">Set to 0 to disable.</p>
        </div>
        <div />
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[color:var(--text-main)]">
              Auto-freeze on critical security events (OWNER only)
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              When enabled, the system can disable accounts after certain CRITICAL events (e.g.
              cross-tenant access attempts).
            </p>
          </div>
          <Switch
            name="autoFreezeEnabled"
            aria-label="Enable auto-freeze"
            defaultChecked={initialValues.autoFreezeEnabled}
          />
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="autoFreezeThreshold">Threshold</Label>
            <select
              id="autoFreezeThreshold"
              name="autoFreezeThreshold"
              className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
              defaultValue={initialValues.autoFreezeThreshold}
            >
              <option value="CRITICAL">CRITICAL (default)</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div className="lg:col-span-2" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div>
          <Label htmlFor="lockoutMaxAttempts">Lockout max attempts</Label>
          <Input
            id="lockoutMaxAttempts"
            name="lockoutMaxAttempts"
            type="number"
            min={1}
            max={20}
            defaultValue={initialValues.lockoutMaxAttempts}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="lockoutWindowMinutes">Window (minutes)</Label>
          <Input
            id="lockoutWindowMinutes"
            name="lockoutWindowMinutes"
            type="number"
            min={1}
            max={120}
            defaultValue={initialValues.lockoutWindowMinutes}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="lockoutDurationMinutes">Lock duration (minutes)</Label>
          <Input
            id="lockoutDurationMinutes"
            name="lockoutDurationMinutes"
            type="number"
            min={1}
            max={240}
            defaultValue={initialValues.lockoutDurationMinutes}
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "Save Security"}
        </Button>
      </div>
    </form>
  );
}
