"use client";

import { useFormState } from "react-dom";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { createInviteTemplateAction } from "@/app/actions/invite-template-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Result = { ok: boolean; message: string };

export function InviteTemplateDialog({ roles }: { roles: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createInviteTemplateAction as any, {
    ok: true,
    message: "",
  } satisfies Result);

  useEffect(() => {
    if (!open) return;
    if (!state.ok) return;
    if (!state.message) return;
    // Close on successful create.
    if (state.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [open, router, state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create Invite Template</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                name="name"
                className="mt-1 h-9"
                placeholder="e.g. Mod Invite"
                required
              />
            </div>
            <div>
              <Label htmlFor="tpl-role">Default Role</Label>
              <select
                id="tpl-role"
                name="defaultRoleId"
                defaultValue={roles[0]?.id ?? ""}
                className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="tpl-exp">Expires In (minutes)</Label>
              <Input
                id="tpl-exp"
                name="expiresInMinutes"
                type="number"
                min={1}
                className="mt-1 h-9"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="tpl-uses">Max Uses</Label>
              <Input
                id="tpl-uses"
                name="maxUses"
                type="number"
                min={1}
                className="mt-1 h-9"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="tpl-2fa"
              name="require2fa"
              type="checkbox"
              className="h-4 w-4 accent-[color:var(--accent)]"
            />
            <Label htmlFor="tpl-2fa">Require 2FA on first login</Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="tpl-approval"
              name="requireApproval"
              type="checkbox"
              className="h-4 w-4 accent-[color:var(--accent)]"
            />
            <Label htmlFor="tpl-approval">Require approval before access</Label>
          </div>

          <div>
            <Label htmlFor="tpl-notes">Notes</Label>
            <Input id="tpl-notes" name="notes" className="mt-1 h-9" placeholder="Optional" />
          </div>

          {state.message ? (
            <p
              className={cn(
                "text-[13px]",
                state.ok
                  ? "text-emerald-600 dark:text-emerald-300"
                  : "text-rose-600 dark:text-rose-300",
              )}
            >
              {state.message}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
