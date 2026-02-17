"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import {
  startTwoFactorEnrollmentAction,
  confirmTwoFactorEnrollmentAction,
  disableTwoFactorAction,
  regenerateBackupCodesAction,
  type TwoFactorActionResult,
} from "@/app/actions/two-factor-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TwoFactorActionResult = { success: false, message: "" };

export function TwoFactorSettings({
  enabled,
  actionsEnabled,
}: {
  enabled: boolean;
  actionsEnabled: boolean;
}) {
  const router = useRouter();
  const [showBackupCodes, setShowBackupCodes] = useState<string[] | null>(null);

  const [startState, startAction, startPending] = useActionState(
    startTwoFactorEnrollmentAction,
    initialState,
  );
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmTwoFactorEnrollmentAction,
    initialState,
  );
  const [disableState, disableAction, disablePending] = useActionState(
    disableTwoFactorAction,
    initialState,
  );
  const [regenState, regenAction, regenPending] = useActionState(
    regenerateBackupCodesAction,
    initialState,
  );

  useEffect(() => {
    if (confirmState.success && confirmState.backupCodes?.length) {
      setShowBackupCodes(confirmState.backupCodes);
    }
  }, [confirmState]);

  useEffect(() => {
    if (regenState.success && regenState.backupCodes?.length) {
      setShowBackupCodes(regenState.backupCodes);
    }
  }, [regenState]);

  if (!actionsEnabled) {
    return (
      <p className="text-[13px] text-[color:var(--text-muted)]">
        Two-factor setup is unavailable until your account is linked to a database user.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">
            Two-factor authentication (TOTP)
          </p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Use an authenticator app. Backup codes can be used once if you lose access.
          </p>
        </div>
        <span
          className={`inline-flex h-7 items-center rounded-full border border-[color:var(--border)] px-2 text-xs ${
            enabled
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-black/[0.03] text-[color:var(--text-muted)] dark:bg-white/[0.06]"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {showBackupCodes ? (
        <BackupCodesPanel
          codes={showBackupCodes}
          onDone={() => {
            setShowBackupCodes(null);
            router.refresh();
          }}
        />
      ) : null}

      {!enabled ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <form
            action={startAction}
            className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
              Start Setup
            </p>
            <div>
              <Label htmlFor="start-password">Confirm password</Label>
              <Input
                id="start-password"
                name="password"
                type="password"
                required
                className="mt-1"
              />
            </div>
            <p
              role="status"
              aria-live="polite"
              className={`min-h-4 text-xs ${startState.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {startState.message}
            </p>
            <Button type="submit" variant="primary" disabled={startPending}>
              {startPending ? "Working..." : "Generate QR"}
            </Button>
          </form>

          <form
            action={confirmAction}
            className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
              Confirm
            </p>
            <div className="space-y-2">
              {startState.success && startState.qrCodeDataUrl ? (
                <div className="flex items-start gap-3">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-[color:var(--border)] bg-white">
                    <Image
                      src={startState.qrCodeDataUrl}
                      alt="2FA QR code"
                      fill
                      sizes="112px"
                      className="object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-[color:var(--text-main)]">
                      Scan this QR code in your authenticator app.
                    </p>
                    {startState.secret ? (
                      <p className="mt-1 break-all font-mono text-[11px] text-[color:var(--text-muted)]">
                        Secret: {startState.secret}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[color:var(--text-muted)]">
                  Generate a QR code first.
                </p>
              )}
              <div>
                <Label htmlFor="confirm-code">6-digit code</Label>
                <Input
                  id="confirm-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="mt-1"
                  required
                />
              </div>
            </div>
            <p
              role="status"
              aria-live="polite"
              className={`min-h-4 text-xs ${confirmState.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {confirmState.message}
            </p>
            <Button
              type="submit"
              variant="primary"
              disabled={confirmPending || !startState.success}
            >
              {confirmPending ? "Enabling..." : "Enable 2FA"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <form
            action={regenAction}
            className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
              Backup Codes
            </p>
            <p className="text-[13px] text-[color:var(--text-muted)]">
              Generate a fresh set of one-time backup codes.
            </p>
            <div>
              <Label htmlFor="regen-password">Confirm password</Label>
              <Input
                id="regen-password"
                name="password"
                type="password"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="regen-code">Authenticator code</Label>
              <Input id="regen-code" name="code" inputMode="numeric" required className="mt-1" />
            </div>
            <p
              role="status"
              aria-live="polite"
              className={`min-h-4 text-xs ${regenState.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {regenState.message}
            </p>
            <Button type="submit" variant="primary" disabled={regenPending}>
              {regenPending ? "Working..." : "Regenerate codes"}
            </Button>
          </form>

          <form
            action={disableAction}
            className="space-y-2 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
              Disable 2FA
            </p>
            <p className="text-[13px] text-[color:var(--text-muted)]">
              Disabling 2FA reduces account security.
            </p>
            <div>
              <Label htmlFor="disable-password">Confirm password</Label>
              <Input
                id="disable-password"
                name="password"
                type="password"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="disable-code">Authenticator or backup code</Label>
              <Input id="disable-code" name="code" required className="mt-1" />
            </div>
            <p
              role="status"
              aria-live="polite"
              className={`min-h-4 text-xs ${disableState.success ? "text-emerald-600" : "text-rose-600"}`}
            >
              {disableState.message}
            </p>
            <Button type="submit" variant="destructive" disabled={disablePending}>
              {disablePending ? "Working..." : "Disable 2FA"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function BackupCodesPanel({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Backup codes</p>
          <p className="text-xs text-[color:var(--text-muted)]">
            Save these now. Each code can be used once.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(codes.join("\n"));
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                // Ignore clipboard errors.
              }
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>

      <div className="mt-2 grid gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3 font-mono text-[13px] text-[color:var(--text-main)] sm:grid-cols-2">
        {codes.map((code) => (
          <div key={code} className="rounded-md bg-black/[0.03] px-2 py-1 dark:bg-white/[0.06]">
            {code}
          </div>
        ))}
      </div>
    </section>
  );
}
