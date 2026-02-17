"use client";

import { useActionState } from "react";

import { updateDiscordCommunityConfigAction } from "@/app/actions/discord-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState = { ok: true, message: "" };

export function DiscordCommunityConfigForm({
  initialValues,
  encryptionKeyConfigured,
}: {
  initialValues: {
    guildId: string;
    approvalsChannelId: string | null;
    dispatchChannelId: string | null;
    securityChannelId: string | null;
    botTokenConfigured: boolean;
  };
  encryptionKeyConfigured: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateDiscordCommunityConfigAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="guildId">Guild ID</Label>
          <Input
            id="guildId"
            name="guildId"
            defaultValue={initialValues.guildId}
            placeholder="123456789012345678"
            className="mt-1"
            required
          />
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Used to scope the bot to a specific Discord server.
          </p>
        </div>

        <div>
          <Label htmlFor="approvalsChannelId">Approvals Channel ID (optional)</Label>
          <Input
            id="approvalsChannelId"
            name="approvalsChannelId"
            defaultValue={initialValues.approvalsChannelId ?? ""}
            placeholder="Channel ID"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="dispatchChannelId">Dispatch Channel ID (optional)</Label>
          <Input
            id="dispatchChannelId"
            name="dispatchChannelId"
            defaultValue={initialValues.dispatchChannelId ?? ""}
            placeholder="Channel ID"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="securityChannelId">Security Channel ID (optional)</Label>
          <Input
            id="securityChannelId"
            name="securityChannelId"
            defaultValue={initialValues.securityChannelId ?? ""}
            placeholder="Channel ID"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="botToken">
          Bot Token {initialValues.botTokenConfigured ? "(configured)" : "(optional)"}
        </Label>
        <Input
          id="botToken"
          name="botToken"
          type="password"
          placeholder={
            encryptionKeyConfigured
              ? "Enter to update (not shown again)"
              : "AUTH_ENCRYPTION_KEY required"
          }
          className="mt-1"
          disabled={!encryptionKeyConfigured}
        />
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Stored encrypted at rest. Leave blank to keep the existing token.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "min-h-4 text-xs",
            state.ok
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-rose-600 dark:text-rose-300",
          )}
        >
          {state.message || " "}
        </p>

        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
