export interface ErlcModerationPayload {
  playerName: string;
  action: "warn" | "kick" | "tempban" | "permban";
  reason: string;
  durationMinutes?: number;
}

export interface ErlcModerationResult {
  success: boolean;
  externalId?: string;
  message: string;
}

export async function sendModerationActionToErlc(
  payload: ErlcModerationPayload,
): Promise<ErlcModerationResult> {
  void payload;

  return {
    success: true,
    externalId: `stub-${Date.now()}`,
    message: "Stubbed ERLC integration. Replace with live API client.",
  };
}
