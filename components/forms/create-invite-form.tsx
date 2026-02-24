"use client";

import { useActionState, useMemo, useState } from "react";

import { createInviteAction } from "@/app/actions/invite-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CreateInviteState = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  fieldErrors?: Partial<
    Record<"roleId" | "templateId" | "expiresAt" | "maxUses" | "require2fa" | "requireApproval", string>
  >;
};

const initialState: CreateInviteState = {
  success: false,
  message: "",
  data: undefined,
  fieldErrors: {},
};

export function CreateInviteForm({
  roleOptions,
  templateOptions,
}: {
  roleOptions: Array<{ value: string; label: string }>;
  templateOptions: Array<{
    value: string;
    label: string;
    defaultRoleName: string | null;
    expiresInMinutes: number | null;
    maxUses: number | null;
    require2fa: boolean;
    requireApproval: boolean;
  }>;
}) {
  const [state, action, pending] = useActionState(createInviteAction, initialState);
  const [copied, setCopied] = useState<"invite" | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>(roleOptions[0]?.value ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("1");

  const inviteUrl = typeof state.data?.inviteUrl === "string" ? state.data.inviteUrl : "";
  const selectedTemplate = useMemo(
    () => templateOptions.find((template) => template.value === templateId) ?? null,
    [templateId, templateOptions],
  );

  const isExpiresValid = !expiresAt || !Number.isNaN(new Date(expiresAt).getTime());
  const maxUsesParsed = Number.parseInt(maxUses, 10);
  const isMaxUsesValid = Number.isInteger(maxUsesParsed) && maxUsesParsed >= 1 && maxUsesParsed <= 100;
  const hasRoleOrTemplate = Boolean(templateId || roleId);
  const canSubmit = hasRoleOrTemplate && isMaxUsesValid && isExpiresValid;

  const helperText = selectedTemplate
    ? `Using template defaults${selectedTemplate.defaultRoleName ? ` (${selectedTemplate.defaultRoleName})` : ""}.`
    : "Use templates for consistent rules (role, expiration, 2FA).";

  return (
    <form action={action} className="grid gap-3 md:grid-cols-3">
      <div>
        <Label htmlFor="invite-template">Template</Label>
        <select
          id="invite-template"
          name="templateId"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
        >
          <option value="">No template</option>
          {templateOptions.map((template) => (
            <option key={template.value} value={template.value}>
              {template.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">{helperText}</p>
        {state.fieldErrors?.templateId ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{state.fieldErrors.templateId}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="invite-role">Role (optional)</Label>
        <select
          id="invite-role"
          name="roleId"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          disabled={Boolean(templateId)}
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px] disabled:opacity-70"
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          {templateId ? "Template default role will be applied." : "Optional override for quick invites."}
        </p>
        {state.fieldErrors?.roleId ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{state.fieldErrors.roleId}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="invite-expires">Expires At</Label>
        <Input
          id="invite-expires"
          name="expiresAt"
          type="datetime-local"
          className={cn("mt-1", !isExpiresValid && "border-rose-500/50")}
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />
        {!isExpiresValid ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
            Invite expiration must be a valid date.
          </p>
        ) : null}
        {state.fieldErrors?.expiresAt ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{state.fieldErrors.expiresAt}</p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="invite-max-uses">Max Uses</Label>
        <Input
          id="invite-max-uses"
          name="maxUses"
          type="number"
          min={1}
          max={100}
          value={maxUses}
          onChange={(event) => setMaxUses(event.target.value)}
          className={cn("mt-1", !isMaxUsesValid && "border-rose-500/50")}
          required
        />
        {!isMaxUsesValid ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Max uses must be 1 to 100.</p>
        ) : null}
        {selectedTemplate?.maxUses ? (
          <p className="mt-1 text-xs text-[color:var(--text-muted)]">
            Template cap: {selectedTemplate.maxUses} use{selectedTemplate.maxUses === 1 ? "" : "s"}.
          </p>
        ) : null}
        {state.fieldErrors?.maxUses ? (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{state.fieldErrors.maxUses}</p>
        ) : null}
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
        <Button type="submit" variant="primary" disabled={pending || !canSubmit}>
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
                setCopied("invite");
                setTimeout(() => setCopied(null), 1200);
              }}
            >
              {copied === "invite" ? "Copied" : "Copy"}
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

