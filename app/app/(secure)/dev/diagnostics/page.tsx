import { notFound } from "next/navigation";

import { DiagnosticsPageClient } from "@/components/dev/diagnostics-page";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { ROLE_PRIORITY } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const actor = await requirePermission(Permission.AUDIT_READ);
  if (actor.membership.role.priority < ROLE_PRIORITY.OWNER) {
    notFound();
  }

  return <DiagnosticsPageClient />;
}
