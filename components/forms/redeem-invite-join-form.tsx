"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { redeemInviteJoinAction } from "@/app/actions/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  success: false,
  message: "",
  data: undefined as Record<string, unknown> | undefined,
};

export function RedeemInviteJoinForm({
  token,
  requireBetaKey,
  redirectTo = "/app/dashboard",
}: {
  token: string;
  requireBetaKey: boolean;
  redirectTo?: string;
}) {
  const router = useRouter();
  const action = redeemInviteJoinAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.success) return;
    const requireApproval = Boolean(state.data && (state.data as any).requireApproval);
    if (requireApproval) return;
    // Signed-in join: take the user directly into the app on success.
    const t = window.setTimeout(() => {
      router.push(redirectTo);
    }, 350);
    return () => window.clearTimeout(t);
  }, [redirectTo, router, state.data, state.success]);

  return (
    <form action={formAction} className="space-y-3">
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
        {pending ? "Redeeming..." : "Join Community"}
      </Button>
    </form>
  );
}
