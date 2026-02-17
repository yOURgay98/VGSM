import Link from "next/link";
import { DispatchCallStatus } from "@prisma/client";

import { ConsoleLayout } from "@/components/layout/utility/console-layout";
import { MacWindow } from "@/components/layout/mac-window";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dispatchCallStatusVariant } from "@/lib/presenters";
import { Permission } from "@/lib/security/permissions";
import { requirePermission } from "@/lib/services/auth";
import { listDispatchCalls } from "@/lib/services/dispatch";
import { formatRelativeTime } from "@/lib/utils";

export default async function DispatchSupervisorPage() {
  const actor = await requirePermission(Permission.DISPATCH_READ);

  const { items: openCalls } = await listDispatchCalls({
    communityId: actor.communityId,
    status: DispatchCallStatus.OPEN,
    take: 60,
  });

  return (
    <ConsoleLayout
      storageKey="dispatch:supervisor"
      title="Supervisor"
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/app/dispatch">Calls</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/dispatch/units">Units</Link>
          </Button>
        </div>
      }
      list={
        <div className="p-3">
          <MacWindow
            title="Open Calls"
            subtitle="Calls waiting for assignment"
            contentClassName="space-y-2"
          >
            {openCalls.length === 0 ? (
              <p className="text-[13px] text-[color:var(--text-muted)]">No open calls.</p>
            ) : (
              openCalls.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] p-2"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/app/dispatch?callId=${c.id}`}
                      className="ui-transition truncate text-[13px] font-medium text-[color:var(--text-main)] hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                      {formatRelativeTime(c.updatedAt)}
                    </p>
                  </div>
                  <Badge variant={dispatchCallStatusVariant(c.status)}>{c.status}</Badge>
                </div>
              ))
            )}
          </MacWindow>
        </div>
      }
      inspector={null}
      inspectorEmpty={
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[color:var(--text-main)]">Supervisor View</p>
          <p className="text-[13px] text-[color:var(--text-muted)]">
            Use this space for escalations and staffing metrics in the next phase.
          </p>
        </div>
      }
    />
  );
}
