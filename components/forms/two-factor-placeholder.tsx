"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function TwoFactorPlaceholder() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--text-main)]">
            Two-factor authentication
          </h3>
          <p className="text-xs text-[color:var(--text-muted)]">
            Placeholder UI for upcoming TOTP/WebAuthn support.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label="Enable two factor authentication"
        />
      </div>
      <div className="mt-3 rounded-xl border border-dashed border-[color:var(--border)] p-3 text-sm text-[color:var(--text-main)]">
        {enabled
          ? "2FA enrollment wizard would open here (QR setup + backup codes)."
          : "2FA is currently disabled."}
      </div>
      <div className="mt-3">
        <Button size="sm" disabled>
          Configure 2FA (Coming Soon)
        </Button>
      </div>
    </div>
  );
}
