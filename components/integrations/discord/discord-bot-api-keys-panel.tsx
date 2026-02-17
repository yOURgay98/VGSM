"use client";

import { useActionState, useMemo, useTransition } from "react";

import { createDiscordBotApiKeyAction, revokeApiKeyAction } from "@/app/actions/api-key-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDateTime } from "@/lib/utils";

const initialState = { ok: true, message: "", key: undefined as string | undefined };

export function DiscordBotApiKeysPanel({
  keys,
}: {
  keys: Array<{
    id: string;
    name: string;
    createdAt: Date;
    revokedAt: Date | null;
    createdByUser: { id: string; name: string; email: string } | null;
  }>;
}) {
  const [state, formAction, pending] = useActionState(createDiscordBotApiKeyAction, initialState);
  const [revoking, startRevoke] = useTransition();

  const activeKeys = useMemo(() => keys.filter((k) => !k.revokedAt), [keys]);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[240px] flex-1">
            <Label htmlFor="name">Key Name</Label>
            <Input id="name" name="name" defaultValue="Discord Bot" className="mt-1" />
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              Generated keys are shown once. Store it in your bot environment as{" "}
              <code>VSM_API_KEY</code>.
            </p>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Creating..." : "Create API Key"}
          </Button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-2 min-h-4 text-xs",
            state.ok
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-rose-600 dark:text-rose-300",
          )}
        >
          {state.message || " "}
        </p>

        {state.ok && state.key ? (
          <div className="mt-2 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2">
            <p className="text-xs font-semibold text-[color:var(--text-main)]">New API Key</p>
            <div className="mt-1 flex items-center gap-2">
              <Input readOnly value={state.key} className="font-mono text-[12px]" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void navigator.clipboard?.writeText(state.key ?? "")}
              >
                Copy
              </Button>
            </div>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              This key will not be shown again.
            </p>
          </div>
        ) : null}
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[color:var(--text-main)]">Keys</p>
          <p className="text-xs text-[color:var(--text-muted)]">{activeKeys.length} active</p>
        </div>

        {keys.length === 0 ? (
          <p className="text-[13px] text-[color:var(--text-muted)]">No API keys created yet.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[color:var(--text-main)]">
                    {k.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                    Created {formatDateTime(k.createdAt)}
                    {k.createdByUser ? ` by ${k.createdByUser.name}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {k.revokedAt ? (
                    <span className="text-xs font-semibold text-[color:var(--text-muted)]">
                      Revoked {formatDateTime(k.revokedAt)}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={revoking}
                      onClick={() => {
                        startRevoke(async () => {
                          await revokeApiKeyAction(k.id);
                        });
                      }}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
