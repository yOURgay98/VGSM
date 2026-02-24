"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ShieldAlert } from "lucide-react";

import {
  disableSensitiveModeAction,
  enableSensitiveModeAction,
} from "@/app/actions/sensitive-mode-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Status = { enabled: boolean; expiresAt: string | null };

interface SensitiveModeToggleProps {
  variant?: "icon" | "menu";
}

export function SensitiveModeToggle({ variant = "icon" }: SensitiveModeToggleProps) {
  const [status, setStatus] = useState<Status>({ enabled: false, expiresAt: null });
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [formState, setFormState] = useState({ password: "", code: "" });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text: string }>({
    kind: "idle",
    text: "",
  });

  useEffect(() => {
    let handle: number | null = null;

    const tick = async () => {
      try {
        const res = await fetch("/api/sensitive-mode", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as Status;
        setStatus({ enabled: Boolean(payload.enabled), expiresAt: payload.expiresAt ?? null });
      } catch {
        // Ignore.
      }
    };

    void tick();
    handle = window.setInterval(tick, 20_000);
    return () => {
      if (handle) window.clearInterval(handle);
    };
  }, []);

  const timeLeft = useMemo(() => {
    if (!status.enabled || !status.expiresAt) return null;
    const diff = new Date(status.expiresAt).getTime() - Date.now();
    if (!Number.isFinite(diff) || diff <= 0) return "expiring";
    const mins = Math.floor(diff / 60_000);
    const secs = Math.floor((diff % 60_000) / 1000);
    if (mins <= 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  }, [status.enabled, status.expiresAt]);

  const badge = status.enabled ? (
    <span
      aria-hidden
      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_2px_var(--titlebar-bg)]"
    />
  ) : null;

  const trigger =
    variant === "menu" ? (
      <button
        type="button"
        className={cn(
          "ui-transition flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-black/[0.03] dark:hover:bg-white/[0.08]",
          status.enabled && "text-[color:var(--text-main)]",
        )}
        aria-label={status.enabled ? "Sensitive mode enabled" : "Enable sensitive mode"}
        title={status.enabled && timeLeft ? `Sensitive mode: ${timeLeft}` : "Sensitive mode"}
      >
        <span className="inline-flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          Sensitive mode
        </span>
        <span className="text-xs text-[color:var(--text-muted)]">
          {status.enabled ? timeLeft ?? "On" : "Off"}
        </span>
      </button>
    ) : (
      <button
        type="button"
        className={cn(
          "ui-transition relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[color:var(--text-main)] hover:bg-black/[0.03] dark:hover:bg-white/[0.07]",
          status.enabled && "bg-black/[0.02] dark:bg-white/[0.06]",
        )}
        aria-label={status.enabled ? "Sensitive mode enabled" : "Enable sensitive mode"}
        title={status.enabled && timeLeft ? `Sensitive mode: ${timeLeft}` : "Sensitive mode"}
      >
        {badge}
        <ShieldAlert className="h-4 w-4" />
      </button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setMessage({ kind: "idle", text: "" });
        setFormState({ password: "", code: "" });
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sensitive Operations Mode</DialogTitle>
          <DialogDescription>
            Enables high-risk actions temporarily. Confirm with your password or a 2FA/backup code.
          </DialogDescription>
        </DialogHeader>

        {status.enabled ? (
          <div className="space-y-3">
            <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
              <p className="text-[13px] font-medium text-[color:var(--text-main)]">
                Sensitive mode is active.
              </p>
              <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                Expires {status.expiresAt ? new Date(status.expiresAt).toLocaleString() : "soon"}.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const res = await disableSensitiveModeAction();
                  setMessage({ kind: res.success ? "success" : "error", text: res.message });
                  setStatus({ enabled: false, expiresAt: null });
                });
              }}
            >
              {pending ? "Working..." : "Disable"}
            </Button>
            {message.text ? (
              <p
                className={cn(
                  "text-xs",
                  message.kind === "error" ? "text-rose-600" : "text-emerald-600",
                )}
              >
                {message.text}
              </p>
            ) : null}
          </div>
        ) : (
          <form
            action={(fd) => {
              setMessage({ kind: "idle", text: "" });
              startTransition(async () => {
                const res = await enableSensitiveModeAction({ success: false, message: "" }, fd);
                setMessage({ kind: res.success ? "success" : "error", text: res.message });
                if (res.success) {
                  setStatus({ enabled: true, expiresAt: res.expiresAt ?? null });
                  setTimeout(() => setOpen(false), 250);
                }
              });
            }}
            className="space-y-3"
          >
            <div className="grid gap-2">
              <div>
                <Label htmlFor="sensitive-password">Password (optional)</Label>
                <Input
                  id="sensitive-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formState.password}
                  onChange={(e) => setFormState((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="sensitive-code">2FA / Backup code (optional)</Label>
                <Input
                  id="sensitive-code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={formState.code}
                  onChange={(e) => setFormState((prev) => ({ ...prev, code: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {message.text ? (
              <p
                className={cn(
                  "text-xs",
                  message.kind === "error" ? "text-rose-600" : "text-emerald-600",
                )}
              >
                {message.text}
              </p>
            ) : null}

            <div className="flex items-center justify-end">
              <Button type="submit" variant="primary" disabled={pending}>
                {pending ? "Verifying..." : "Enable"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
