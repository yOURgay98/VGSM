"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

import { createCommunityFromOnboardingAction } from "@/app/actions/community-actions";
import { MacWindow } from "@/components/layout/mac-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { success: false, message: "", communityId: undefined as string | undefined };

export function CreateCommunityCard() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    createCommunityFromOnboardingAction,
    initialState,
  );

  useEffect(() => {
    if (!state.success || !state.communityId) return;
    router.push("/app/dashboard");
    router.refresh();
  }, [router, state.communityId, state.success]);

  return (
    <MacWindow title="Create community" subtitle="Start a new VSM workspace as OWNER.">
      <form action={action} className="space-y-3">
        <div>
          <label
            htmlFor="community-name"
            className="text-[13px] font-medium text-[color:var(--text-main)]"
          >
            Community name
          </label>
          <Input
            id="community-name"
            name="name"
            required
            minLength={3}
            placeholder="e.g. Vanguard RP Ops"
            className="mt-1 h-9"
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            A secure workspace with OWNER permissions will be created for your account.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}>
            {state.message}
          </p>
          <Button type="submit" size="sm" disabled={pending}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            {pending ? "Creating..." : "Create Community"}
          </Button>
        </div>
      </form>
    </MacWindow>
  );
}
