"use client";

import { useActionState } from "react";

import { updateMapSettingsAction } from "@/app/actions/map-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { success: false, message: "" };

export function MapSettingsForm({ initialValues }: { initialValues: { styleUrl: string } }) {
  const [state, action, pending] = useActionState(updateMapSettingsAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="styleUrl">Map Style URL</Label>
        <Input
          id="styleUrl"
          name="styleUrl"
          defaultValue={initialValues.styleUrl}
          className="mt-1"
          placeholder="/map/style.json"
          required
        />
        <p className="mt-1 text-xs text-[color:var(--text-muted)]">
          Default: <code className="text-[12px]">/map/style.json</code>. You can also provide an{" "}
          <code className="text-[12px]">https://</code> style URL.
        </p>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[13px] text-[color:var(--text-muted)]">
        This setting is community-scoped and affects the Dispatch map (and Control map when
        enabled).
      </div>

      <div className="flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "Save Map Settings"}
        </Button>
      </div>
    </form>
  );
}
