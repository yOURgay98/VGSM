"use client";

import { useActionState, useState } from "react";

import { createInviteAction } from "@/app/actions/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {
  success: false,
  message: "",
  data: undefined as Record<string, unknown> | undefined,
};

export function CreateInviteForm({
  roleOptions,
  templateOptions,
}: {
  roleOptions: Array<{ value: string; label: string }>;
  templateOptions: Array<{ value: string; label: string }>;
}) {
  const [state, action, pending] = useActionState(createInviteAction, initialState);
  const [copied, setCopied] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");

  const inviteUrl = typeof state.data?.inviteUrl === "string" ? state.data.inviteUrl : "";

  return (
    <form action={action} className="grid gap-3 md:grid-cols-3">
      <div>
        <Label htmlFor="invite-template">Template</Label>
        <select
          id="invite-template"
          name="templateId"
          defaultValue=""
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          <option value="">No template</option>
          {templateOptions.map((tpl) => (
            <option key={tpl.value} value={tpl.value}>
              {tpl.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Use templates for consistent rules (role, expiration, 2FA).
        </p>
      </div>

      <div>
        <Label htmlFor="invite-role">Role (optional)</Label>
        <select
          id="invite-role"
          name="roleId"
          defaultValue={roleOptions[0]?.value}
          disabled={Boolean(templateId)}
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          If a template is selected, its default role is used.
        </p>
      </div>

      <div>
        <Label htmlFor="invite-expires">Expires At</Label>
        <Input id="invite-expires" name="expiresAt" type="datetime-local" className="mt-1" />
      </div>

      <div>
        <Label htmlFor="invite-max-uses">Max Uses</Label>
        <Input
          id="invite-max-uses"
          name="maxUses"
          type="number"
          min={1}
          defaultValue={1}
          className="mt-1"
          required
        />
      </div>

      <div className="md:col-span-3 flex items-center gap-2">
        <input
          id="invite-require2fa"
          name="require2fa"
          type="checkbox"
          className="h-4 w-4 accent-[color:var(--accent)]"
        />
        <Label htmlFor="invite-require2fa">Require 2FA on first login (invite-level)</Label>
      </div>

      <div className="md:col-span-3 flex items-center gap-2">
        <input
          id="invite-require-approval"
          name="requireApproval"
          type="checkbox"
          className="h-4 w-4 accent-[color:var(--accent)]"
        />
        <Label htmlFor="invite-require-approval">
          Require approval before access (invite-level)
        </Label>
      </div>

      <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating..." : "Create Invite"}
        </Button>
      </div>

      {inviteUrl ? (
        <div className="md:col-span-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
            Invite URL
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-md border border-[color:var(--border)] bg-black/5 px-2 py-1 text-xs text-[color:var(--text-main)] dark:bg-white/[0.06]">
              {inviteUrl}
            </code>
            <Button
              size="sm"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
            Save this link now. For security, the raw token is only shown once.
          </p>
        </div>
      ) : null}
    </form>
  );
}
