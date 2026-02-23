"use client";

import { useActionState, useMemo, useTransition } from "react";

import {
  createGeneralApiKeyAction,
  revokeApiKeyAction,
  rotateApiKeyAction,
} from "@/app/actions/api-key-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDateTime } from "@/lib/utils";

const initialState = { ok: true, message: "", key: undefined as string | undefined };

interface ApiKeyRow {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  permissions: string[];
  createdByUser: { id: string; name: string; email: string } | null;
}

export function ApiKeysManager({ keys }: { keys: ApiKeyRow[] }) {
  const [state, formAction, pending] = useActionState(createGeneralApiKeyAction, initialState);
  const [busy, startTransition] = useTransition();

  const activeCount = useMemo(() => keys.filter((k) => !k.revokedAt).length, [keys]);

  return (
    <div className="space-y-3">
      <form
        action={formAction}
        className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 shadow-[var(--panel-shadow)]"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label htmlFor="api-key-name">Key name</Label>
            <Input id="api-key-name" name="name" placeholder="e.g. ERLC Event Bridge" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="api-key-profile">Profile</Label>
            <select
              id="api-key-profile"
              name="profile"
              className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
              defaultValue="custom"
            >
              <option value="custom">Custom (read-only baseline)</option>
              <option value="erlc_ingest">ERLC Ingestion</option>
              <option value="discord_bot">Discord Bot</option>
              <option value="read_only">Read-only API</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
          <p className="text-xs text-[color:var(--text-muted)]">
            Keys are stored as hashes, shown once, and can be revoked or rotated at any time.
          </p>
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
          <div className="mt-2 rounded-[var(--radius-control)] border border-emerald-500/25 bg-emerald-500/10 p-3">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              API key (copy now)
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Input readOnly value={state.key} className="font-mono text-[12px]" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void navigator.clipboard?.writeText(state.key ?? "")}
              >
                Copy
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[color:var(--text-main)]">Keys</p>
          <p className="text-xs text-[color:var(--text-muted)]">{activeCount} active</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-xs text-[color:var(--text-muted)]">
              <tr>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Permissions</th>
                <th className="py-2 pr-3 font-medium">Last used</th>
                <th className="py-2 pr-3 font-medium">Created</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-1 font-medium" />
              </tr>
            </thead>
            <tbody className="text-[color:var(--text-main)]">
              {keys.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No API keys created yet.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="border-t border-[color:var(--border)]">
                    <td className="py-2 pr-3">
                      <p className="font-medium">{k.name}</p>
                      <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                        {k.createdByUser ? `by ${k.createdByUser.name}` : "service"}
                      </p>
                    </td>
                    <td className="py-2 pr-3 text-xs text-[color:var(--text-muted)]">
                      {k.permissions.join(", ")}
                    </td>
                    <td className="py-2 pr-3 text-[color:var(--text-muted)]">
                      {k.lastUsedAt ? formatDateTime(new Date(k.lastUsedAt)) : "-"}
                    </td>
                    <td className="py-2 pr-3 text-[color:var(--text-muted)]">
                      {formatDateTime(new Date(k.createdAt))}
                    </td>
                    <td className="py-2 pr-3">
                      {k.revokedAt ? (
                        <span className="text-xs text-rose-600 dark:text-rose-300">Revoked</span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-300">Active</span>
                      )}
                    </td>
                    <td className="py-2 pr-1 text-right">
                      <div className="flex justify-end gap-1">
                        {!k.revokedAt ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              startTransition(async () => {
                                const rotated = await rotateApiKeyAction(k.id);
                                if (rotated.ok && rotated.key) {
                                  await navigator.clipboard?.writeText(rotated.key);
                                }
                              });
                            }}
                          >
                            Rotate
                          </Button>
                        ) : null}
                        {!k.revokedAt ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              startTransition(async () => {
                                await revokeApiKeyAction(k.id);
                              });
                            }}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

