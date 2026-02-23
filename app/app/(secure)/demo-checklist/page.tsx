import { notFound } from "next/navigation";

import { MacWindow } from "@/components/layout/mac-window";
import { DemoChecklist } from "@/components/demo/demo-checklist";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function DemoChecklistPage() {
  const actor = await requirePermission(Permission.SETTINGS_EDIT);
  if (actor.membership.role.name !== "OWNER") {
    notFound();
  }

  return (
    <div className="space-y-3">
      <MacWindow title="Demo Checklist" subtitle="Owner-only guided flow for live demonstrations">
        <DemoChecklist />
      </MacWindow>
    </div>
  );
}

