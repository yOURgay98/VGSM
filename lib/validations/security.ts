import { z } from "zod";

function booleanFromForm() {
  return z.preprocess((value) => {
    if (value === true || value === "true" || value === "1" || value === "on") return true;
    if (value === false || value === "false" || value === "0" || value === "off") return false;
    if (value === null || value === undefined || value === "") return false;
    return Boolean(value);
  }, z.boolean());
}

export const securitySettingsSchema = z.object({
  require2FAForPrivileged: booleanFromForm(),
  twoPersonRule: booleanFromForm(),
  requireSensitiveModeForHighRisk: booleanFromForm(),
  sensitiveModeTtlMinutes: z.coerce.number().int().min(1).max(120),
  highRiskCommandCooldownSeconds: z.coerce.number().int().min(0).max(3600),
  betaAccessEnabled: booleanFromForm(),
  autoFreezeEnabled: booleanFromForm(),
  autoFreezeThreshold: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("CRITICAL"),
  lockoutMaxAttempts: z.coerce.number().int().min(1).max(20),
  lockoutWindowMinutes: z.coerce.number().int().min(1).max(120),
  lockoutDurationMinutes: z.coerce.number().int().min(1).max(240),
});
