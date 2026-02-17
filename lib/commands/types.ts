import { RiskLevel } from "@prisma/client";
import { z } from "zod";

import type { Permission } from "@/lib/security/permissions";

export type CommandId =
  | "warning.create"
  | "kick.record"
  | "ban.temp"
  | "ban.perm"
  | "ban.extend"
  | "ban.remove"
  | "player.flag"
  | "note.add"
  | "case.from_report"
  | "case.assign"
  | "report.bulk_resolve"
  | "case.export_packet";

export type CommandInput = Record<string, unknown>;

export type CommandRunResult =
  | { status: "executed"; message: string; redirectUrl?: string }
  | { status: "pending_approval"; message: string; approvalId: string };

export type CommandField =
  | { name: string; label: string; type: "text"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "textarea"; placeholder?: string; required?: boolean }
  | {
      name: string;
      label: string;
      type: "number";
      placeholder?: string;
      required?: boolean;
      min?: number;
      max?: number;
    }
  | {
      name: string;
      label: string;
      type: "select";
      required?: boolean;
      options: Array<{ value: string; label: string }>;
    }
  | { name: string; label: string; type: "multi"; required?: boolean; placeholder?: string };

export interface CommandDefinition<TSchema extends z.ZodTypeAny> {
  id: CommandId;
  name: string;
  description: string;
  requiredPermission: Permission;
  riskLevel: RiskLevel;
  schema: TSchema;
  fields: CommandField[];
}
