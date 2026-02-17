import { MacWindow } from "@/components/layout/mac-window";
import { CommandsTable } from "@/components/commands/commands-table";
import { COMMANDS } from "@/lib/commands/registry";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/services/auth";
import { Permission } from "@/lib/security/permissions";

export default async function CommandsPage() {
  const user = await requirePermission(Permission.COMMANDS_RUN);
  const canManage = user.permissions.includes(Permission.COMMANDS_MANAGE);

  const toggles = await prisma.commandToggle.findMany({
    where: { communityId: user.communityId },
    select: { id: true, enabled: true, updatedAt: true, updatedByUserId: true },
  });
  const enabledById = new Map(toggles.map((t) => [t.id, t.enabled]));

  const rows = COMMANDS.map((cmd) => ({
    id: cmd.id,
    name: cmd.name,
    description: cmd.description,
    riskLevel: cmd.riskLevel,
    requiredPermission: cmd.requiredPermission,
    enabled: enabledById.get(cmd.id) ?? true,
  }));

  return (
    <div className="space-y-2">
      <MacWindow title="Commands" subtitle="Audited staff commands and execution controls">
        <CommandsTable commands={rows} canManage={canManage} />
      </MacWindow>
    </div>
  );
}
