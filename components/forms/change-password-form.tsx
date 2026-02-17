"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { success: false, message: "" };

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          name="currentPassword"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" type="password" name="newPassword" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          className="mt-1"
        />
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
          {pending ? "Updating..." : "Change Password"}
        </Button>
      </div>
    </form>
  );
}
