"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { redeemInviteAction } from "@/app/actions/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  success: false,
  message: "",
  data: undefined as Record<string, unknown> | undefined,
};

export function RedeemInviteForm({
  token,
  requireBetaKey,
}: {
  token: string;
  requireBetaKey: boolean;
}) {
  const router = useRouter();
  const action = redeemInviteAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) return;
    const requireApproval = Boolean(state.data && (state.data as any).requireApproval);
    if (requireApproval) return;
    const callbackUrl = "/app/dashboard?tour=welcome";
    const t = window.setTimeout(() => {
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }, 450);
    return () => window.clearTimeout(t);
  }, [router, state.data, state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1"
        />
      </div>

      {requireBetaKey ? (
        <div>
          <Label htmlFor="betaKey">Access key</Label>
          <Input
            id="betaKey"
            name="betaKey"
            autoComplete="off"
            spellCheck={false}
            required
            placeholder="VSM-ACCESS-XXXX-XXXX-XXXX-XXXX"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Access keys are required to join during private testing.
          </p>
        </div>
      ) : null}

      <p
        role="status"
        aria-live="polite"
        className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
      >
        {state.message}
      </p>

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
