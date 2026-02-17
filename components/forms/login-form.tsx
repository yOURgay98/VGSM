"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeInternalRedirect } from "@/lib/auth/safe-redirect";

const SIGN_IN_TIMEOUT_MS = 12000;

export function LoginForm({
  callbackUrl,
  initialMessage,
  initialNeedsTwoFactor,
}: {
  callbackUrl?: string;
  initialMessage?: string;
  initialNeedsTwoFactor?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState(initialMessage ?? "");
  const [needsTwoFactor, setNeedsTwoFactor] = useState(Boolean(initialNeedsTwoFactor));

  const safeCallbackUrl = useMemo(
    () => safeInternalRedirect(callbackUrl, "/app/dashboard"),
    [callbackUrl],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const twoFactorCode = String(formData.get("twoFactorCode") ?? "").trim();

    startTransition(async () => {
      try {
        const result = await Promise.race([
          fetch("/api/auth/credentials", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({
              email,
              password,
              twoFactorCode: twoFactorCode || undefined,
              callbackUrl: safeCallbackUrl,
            }),
          }),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS);
          }),
        ]);

        const payload = (await result.json().catch(() => null)) as
          | { ok: true; redirectUrl: string }
          | { ok: false; code: string }
          | null;

        if (!payload) {
          setMessage(
            result.status === 503
              ? "Sign-in service is unavailable. Try again in a moment."
              : "Sign-in failed. Please try again.",
          );
          return;
        }

        if (!payload.ok) {
          const code = payload.code;
          if (code === "2fa_required") {
            setNeedsTwoFactor(true);
            setMessage("Two-factor code required.");
            return;
          }
          if (code === "2fa_invalid") {
            setNeedsTwoFactor(true);
            setMessage("Invalid two-factor code or backup code.");
            return;
          }
          if (code === "rate_limited") {
            setMessage("Too many attempts. Try again in a few minutes.");
            return;
          }
          if (code === "locked") {
            setMessage("Account temporarily locked. Try again later.");
            return;
          }
          if (code === "disabled") {
            setMessage("Account disabled. Contact an owner.");
            return;
          }
          if (code === "service_unavailable") {
            setMessage(
              "Sign-in service is unavailable. Check DATABASE_URL, NEXTAUTH_SECRET, and NEXTAUTH_URL, then retry.",
            );
            return;
          }

          setMessage("Invalid email, password, or code.");
          return;
        }

        window.location.assign(payload.redirectUrl ?? safeCallbackUrl);
      } catch (error) {
        if (error instanceof Error && error.message === "timeout") {
          setMessage("Sign-in timed out. Confirm PostgreSQL is running and try again.");
          return;
        }

        setMessage("Unexpected sign-in error. Please try again.");
      }
    });
  }

  return (
    // Provide a non-JS fallback so users don't accidentally submit credentials via URL
    // if the page hasn't hydrated yet (tunnel/slow network). The API route supports
    // form submissions and will set the session cookie + redirect.
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
      method="post"
      action="/api/auth/credentials"
    >
      <input type="hidden" name="callbackUrl" value={safeCallbackUrl} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="mt-1"
        />
      </div>

      {needsTwoFactor ? (
        <div>
          <Label htmlFor="twoFactorCode">2FA Code or Backup Code</Label>
          <Input
            id="twoFactorCode"
            type="text"
            name="twoFactorCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="mt-1"
            placeholder="123456 or ABCD1234"
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            If you do not have access to your authenticator, use a backup code.
          </p>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="min-h-4 text-xs text-rose-600">
        {message}
      </p>

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
