"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Ticket } from "lucide-react";

import { logoutAction } from "@/app/actions/auth-actions";
import { MacWindow } from "@/components/layout/mac-window";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JoinCommunityCard() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const trimmed = useMemo(() => token.trim(), [token]);

  return (
    <MacWindow title="Join with invite" subtitle="Paste an invite token or full link.">
      <div className="flex flex-col gap-3">
        <div>
          <label
            className="text-[13px] font-medium text-[color:var(--text-main)]"
            htmlFor="invite-token"
          >
            Invite token
          </label>
          <Input
            id="invite-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="e.g. 4f2a... or https://.../invite/4f2a..."
            className="mt-1 h-9"
            autoComplete="off"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            If you paste a full URL, we will extract the token automatically.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <form action={logoutAction}>
            <Button type="submit" size="sm" variant="ghost">
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </form>

          <Button
            type="button"
            size="sm"
            disabled={!trimmed}
            onClick={() => {
              const match = trimmed.match(/\/invite\/([^/?#]+)/i);
              const raw = match?.[1] ?? trimmed;
              const normalized = raw.replace(/[^a-z0-9]/gi, "").toLowerCase();
              if (!normalized) return;
              router.push(`/invite/${encodeURIComponent(normalized)}`);
            }}
          >
            <Ticket className="mr-1.5 h-4 w-4" />
            Redeem
          </Button>
        </div>
      </div>
    </MacWindow>
  );
}
