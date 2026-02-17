import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";
import { DEFAULT_COMMUNITY_ID } from "@/lib/services/community";

export interface SecuritySettings {
  require2FAForPrivileged: boolean;
  twoPersonRule: boolean;
  requireSensitiveModeForHighRisk: boolean;
  sensitiveModeTtlMinutes: number;
  highRiskCommandCooldownSeconds: number;
  betaAccessEnabled: boolean;
  autoFreezeEnabled: boolean;
  autoFreezeThreshold: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lockoutMaxAttempts: number;
  lockoutWindowMinutes: number;
  lockoutDurationMinutes: number;
}

const SECURITY_SETTINGS_KEY = "security";

function defaultBooleanEnv(envVar: string | undefined, fallback: boolean) {
  if (!envVar) return fallback;
  return envVar === "true" || envVar === "1";
}

const defaultSettings: SecuritySettings = {
  require2FAForPrivileged: defaultBooleanEnv(process.env.SECURITY_REQUIRE_2FA_DEFAULT, true),
  twoPersonRule: defaultBooleanEnv(process.env.SECURITY_TWO_PERSON_DEFAULT, true),
  requireSensitiveModeForHighRisk: true,
  sensitiveModeTtlMinutes: 10,
  highRiskCommandCooldownSeconds: 60,
  betaAccessEnabled: true,
  autoFreezeEnabled: false,
  autoFreezeThreshold: "CRITICAL",
  lockoutMaxAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 15,
};

export async function getSecuritySettings(
  communityId = DEFAULT_COMMUNITY_ID,
): Promise<SecuritySettings> {
  const setting = await prisma.setting.findUnique({
    where: {
      communityId_key: { communityId, key: SECURITY_SETTINGS_KEY },
    },
  });

  if (!setting) {
    return defaultSettings;
  }

  const parsed = setting.valueJson as Partial<SecuritySettings>;

  return {
    require2FAForPrivileged:
      typeof parsed.require2FAForPrivileged === "boolean"
        ? parsed.require2FAForPrivileged
        : defaultSettings.require2FAForPrivileged,
    twoPersonRule:
      typeof parsed.twoPersonRule === "boolean"
        ? parsed.twoPersonRule
        : defaultSettings.twoPersonRule,
    requireSensitiveModeForHighRisk:
      typeof parsed.requireSensitiveModeForHighRisk === "boolean"
        ? parsed.requireSensitiveModeForHighRisk
        : defaultSettings.requireSensitiveModeForHighRisk,
    sensitiveModeTtlMinutes:
      typeof parsed.sensitiveModeTtlMinutes === "number" &&
      Number.isFinite(parsed.sensitiveModeTtlMinutes)
        ? parsed.sensitiveModeTtlMinutes
        : defaultSettings.sensitiveModeTtlMinutes,
    highRiskCommandCooldownSeconds:
      typeof parsed.highRiskCommandCooldownSeconds === "number" &&
      Number.isFinite(parsed.highRiskCommandCooldownSeconds)
        ? parsed.highRiskCommandCooldownSeconds
        : defaultSettings.highRiskCommandCooldownSeconds,
    betaAccessEnabled:
      typeof parsed.betaAccessEnabled === "boolean"
        ? parsed.betaAccessEnabled
        : defaultSettings.betaAccessEnabled,
    autoFreezeEnabled:
      typeof parsed.autoFreezeEnabled === "boolean"
        ? parsed.autoFreezeEnabled
        : defaultSettings.autoFreezeEnabled,
    autoFreezeThreshold:
      parsed.autoFreezeThreshold === "LOW" ||
      parsed.autoFreezeThreshold === "MEDIUM" ||
      parsed.autoFreezeThreshold === "HIGH" ||
      parsed.autoFreezeThreshold === "CRITICAL"
        ? parsed.autoFreezeThreshold
        : defaultSettings.autoFreezeThreshold,
    lockoutMaxAttempts:
      typeof parsed.lockoutMaxAttempts === "number" && Number.isFinite(parsed.lockoutMaxAttempts)
        ? parsed.lockoutMaxAttempts
        : defaultSettings.lockoutMaxAttempts,
    lockoutWindowMinutes:
      typeof parsed.lockoutWindowMinutes === "number" &&
      Number.isFinite(parsed.lockoutWindowMinutes)
        ? parsed.lockoutWindowMinutes
        : defaultSettings.lockoutWindowMinutes,
    lockoutDurationMinutes:
      typeof parsed.lockoutDurationMinutes === "number" &&
      Number.isFinite(parsed.lockoutDurationMinutes)
        ? parsed.lockoutDurationMinutes
        : defaultSettings.lockoutDurationMinutes,
  };
}

export async function updateSecuritySettings(input: {
  actorUserId: string;
  communityId: string;
  payload: SecuritySettings;
}) {
  const result = await prisma.setting.upsert({
    where: { communityId_key: { communityId: input.communityId, key: SECURITY_SETTINGS_KEY } },
    create: {
      communityId: input.communityId,
      key: SECURITY_SETTINGS_KEY,
      valueJson: input.payload as unknown as Prisma.InputJsonValue,
    },
    update: { valueJson: input.payload as unknown as Prisma.InputJsonValue },
  });

  await createAuditLog({
    userId: input.actorUserId,
    communityId: input.communityId,
    eventType: AuditEvent.SETTINGS_UPDATED,
    metadata: { key: SECURITY_SETTINGS_KEY, ...input.payload } as unknown as Prisma.InputJsonValue,
  });

  return result;
}
