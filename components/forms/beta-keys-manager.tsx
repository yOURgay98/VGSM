"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Copy, Key, Trash2 } from "lucide-react";

import { createBetaKeyAction, revokeBetaKeyAction } from "@/app/actions/beta-keys-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatDateTime } from "@/lib/utils";

type BetaKeyRow = {
  id: string;
  label: string | null;
  maxUses: number;
  uses: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByUser: { id: string; name: string; email: string } | null;
};

const initialCreateState: { success: boolean; message: string; data?: Record<string, unknown> } = {
  success: false,
  message: "",
};

export function BetaKeysManager({ initialKeys }: { initialKeys: BetaKeyRow[] }) {
  const [keys, setKeys] = useState<BetaKeyRow[]>(initialKeys);
  const [isPending, startTransition] = useTransition();

  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  const [createState, createAction, creating] = useActionState(
    async (prev: typeof initialCreateState, formData: FormData) => {
      const result = await createBetaKeyAction(prev as any, formData);
      if (result.success) {
        // Refresh list by reloading on next navigation; but also optimistic-add a placeholder row.
        startTransition(() => {
          // no-op here; server revalidate will refresh on next navigation
        });
      }
      return result as any;
    },
    initialCreateState,
  );

  const createdKey =
    (createState.success ? (createState.data?.key as string | undefined) : undefined) ?? undefined;

  const createdSummary = useMemo(() => {
    if (!createState.success || !createState.data) return null;
    const id = typeof createState.data.id === "string" ? createState.data.id : null;
    const max = typeof createState.data.maxUses === "number" ? createState.data.maxUses : null;
    const exp = typeof createState.data.expiresAt === "string" ? createState.data.expiresAt : null;
    return { id, maxUses: max, expiresAt: exp };
  }, [createState]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore.
    }
  }

  function statusLabel(row: BetaKeyRow) {
    const now = Date.now();
    const revoked = row.revokedAt ? Date.parse(row.revokedAt) : NaN;
    if (row.revokedAt && Number.isFinite(revoked)) return "Revoked";
    const exp = row.expiresAt ? Date.parse(row.expiresAt) : NaN;
    if (row.expiresAt && Number.isFinite(exp) && exp < now) return "Expired";
    if (row.uses >= row.maxUses) return "Exhausted";
    return "Active";
  }

  async function revoke(id: string) {
    startTransition(async () => {
      const result = await revokeBetaKeyAction(id);
      if (result.success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)),
        );
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-[color:var(--text-muted)]" />
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Create access key</p>
        </div>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Access keys gate community joins during private testing. The raw key is shown once on
          creation.
        </p>

        <form action={createAction} className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Label htmlFor="beta-label">Label (optional)</Label>
            <Input
              id="beta-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Friend invite batch"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="beta-max">Max uses</Label>
            <Input
              id="beta-max"
              name="maxUses"
              type="number"
              min={1}
              max={500}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="beta-exp">Expires at (optional)</Label>
            <Input
              id="beta-exp"
              name="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              Leave blank for no expiry.
            </p>
          </div>

          <div className="flex items-end justify-end">
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? "Generating..." : "Generate Key"}
            </Button>
          </div>
        </form>

        <p
          role="status"
          aria-live="polite"
          className={cn(
            "mt-2 min-h-4 text-xs",
            createState.success ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {createState.message}
        </p>

        {createdKey ? (
          <div className="mt-2 rounded-[var(--radius-control)] border border-emerald-500/25 bg-emerald-500/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Access key (copy now)
                </p>
                <code className="mt-1 block truncate text-[13px] text-emerald-900 dark:text-emerald-100">
                  {createdKey}
                </code>
                {createdSummary?.expiresAt ? (
                  <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                    Expires: {formatDateTime(new Date(createdSummary.expiresAt))}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => copy(createdKey)}
                aria-label="Copy access key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <p className="text-[13px] font-medium text-[color:var(--text-main)]">Keys</p>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Only hashed keys are stored. Use the label and timestamps to identify a key.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="text-left text-xs text-[color:var(--text-muted)]">
              <tr>
                <th className="py-2 pr-3 font-medium">Label</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Uses</th>
                <th className="py-2 pr-3 font-medium">Expires</th>
                <th className="py-2 pr-3 font-medium">Created</th>
                <th className="py-2 pr-3 font-medium" />
              </tr>
            </thead>
            <tbody className="text-[color:var(--text-main)]">
              {keys.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-[13px] text-[color:var(--text-muted)]"
                  >
                    No access keys created yet.
                  </td>
                </tr>
              ) : (
                keys.map((k) => {
                  const status = statusLabel(k);
                  const canRevoke = status === "Active";
                  return (
                    <tr key={k.id} className="border-t border-[color:var(--border)]">
                      <td className="py-2 pr-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{k.label ?? "Untitled key"}</p>
                          <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                            id: {k.id.slice(0, 10)}...
                          </p>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-[color:var(--text-muted)]">{status}</td>
                      <td className="py-2 pr-3 text-[color:var(--text-muted)]">
                        {k.uses}/{k.maxUses}
                      </td>
                      <td className="py-2 pr-3 text-[color:var(--text-muted)]">
                        {k.expiresAt ? formatDateTime(new Date(k.expiresAt)) : "-"}
                      </td>
                      <td className="py-2 pr-3 text-[color:var(--text-muted)]">
                        {formatDateTime(new Date(k.createdAt))}
                      </td>
                      <td className="py-2 pr-1 text-right">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Revoke access key"
                          disabled={!canRevoke || isPending}
                          onClick={() => revoke(k.id)}
                          title={canRevoke ? "Revoke" : "Not revocable"}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          Revocations apply immediately. Already-redeemed keys remain valid for existing
          memberships.
        </p>
      </div>
    </div>
  );
}
