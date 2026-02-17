"use client";

import { useActionState } from "react";

import { updateGeneralSettingsAction } from "@/app/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState = { success: false, message: "" };

export function GeneralSettingsForm({
  initialValues,
}: {
  initialValues: {
    communityName: string;
    theme: "light" | "dark" | "gray";
    tempBanPresets: number[];
  };
}) {
  const [state, action, pending] = useActionState(updateGeneralSettingsAction, initialState);

  return (
    <form action={action} className="space-y-3">
      {/* Preserve the stored default theme without conflicting with local appearance controls. */}
      <input type="hidden" name="theme" value={initialValues.theme} />

      <div>
        <Label htmlFor="communityName">Community Name</Label>
        <Input
          id="communityName"
          name="communityName"
          defaultValue={initialValues.communityName}
          className="mt-1"
          required
        />
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[13px] text-[color:var(--text-muted)]">
        Theme and accent are configured per device in{" "}
        <span className="font-medium text-[color:var(--text-main)]">Appearance</span> above.
      </div>

      <div>
        <Label htmlFor="tempBanPresets">Temp Ban Presets (minutes, comma separated)</Label>
        <Input
          id="tempBanPresets"
          name="tempBanPresets"
          defaultValue={initialValues.tempBanPresets.join(",")}
          className="mt-1"
          required
        />
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--text-main)]">
              Require evidence URLs for ban actions
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              UI placeholder for policy toggle.
            </p>
          </div>
          <Switch aria-label="Require evidence for bans" defaultChecked />
        </div>
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
          {pending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
