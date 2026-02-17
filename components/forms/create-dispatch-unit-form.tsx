"use client";

import { useActionState } from "react";
import { DispatchUnitType } from "@prisma/client";

import { createDispatchUnitAction } from "@/app/actions/dispatch-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { success: false, message: "" };

const unitTypes: Array<{ value: DispatchUnitType; label: string }> = [
  { value: DispatchUnitType.LEO, label: "LEO" },
  { value: DispatchUnitType.EMS, label: "EMS" },
  { value: DispatchUnitType.FIRE, label: "Fire" },
  { value: DispatchUnitType.CIV, label: "Civilian" },
];

export function CreateDispatchUnitForm() {
  const [state, action, pending] = useActionState(createDispatchUnitAction, initialState);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="unit-callsign">Call Sign</Label>
        <Input id="unit-callsign" name="callSign" required placeholder="1-A-12" className="mt-1" />
      </div>

      <div>
        <Label htmlFor="unit-type">Type</Label>
        <select
          id="unit-type"
          name="type"
          className="input-neutral ui-transition mt-1 h-9 w-full px-3 text-[13px]"
          defaultValue={DispatchUnitType.LEO}
        >
          {unitTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 flex items-center justify-between">
        <p
          role="status"
          aria-live="polite"
          className={`min-h-4 text-xs ${state.success ? "text-emerald-600" : "text-rose-600"}`}
        >
          {state.message}
        </p>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving..." : "Create Unit"}
        </Button>
      </div>
    </form>
  );
}
