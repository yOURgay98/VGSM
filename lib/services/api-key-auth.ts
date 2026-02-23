import { prisma } from "@/lib/db";
import { hashApiKey } from "@/lib/security/api-key";
import { normalizeApiKeyPermissions } from "@/lib/services/api-keys";
import { createAuditLog, AuditEvent } from "@/lib/services/audit";

export class ApiKeyAuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ApiKeyContext = {
  id: string;
  communityId: string;
  name: string;
  permissions: readonly string[];
};

const API_KEY_HEADER = "x-api-key";
const USAGE_AUDIT_THROTTLE_MS = 5 * 60_000;
const usageAuditMemory = new Map<string, number>();

export async function requireApiKeyFromRequest(
  request: Request,
  opts?: { requiredPermission?: string },
): Promise<ApiKeyContext> {
  const raw = request.headers.get(API_KEY_HEADER);
  if (!raw) {
    throw new ApiKeyAuthError(401, "Missing API key.");
  }

  const token = raw.trim();
  if (!token || token.length < 20) {
    throw new ApiKeyAuthError(401, "Invalid API key.");
  }

  const keyHash = hashApiKey(token);
  const record = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      communityId: true,
      name: true,
      revokedAt: true,
      lastUsedAt: true,
      permissionsJson: true,
    },
  });

  if (!record || record.revokedAt) {
    throw new ApiKeyAuthError(401, "Invalid API key.");
  }

  const permissions = normalizeApiKeyPermissions(record.permissionsJson);
  if (opts?.requiredPermission && !permissions.includes(opts.requiredPermission)) {
    throw new ApiKeyAuthError(403, "API key lacks required permission.");
  }

  const now = Date.now();
  const lastAudit = usageAuditMemory.get(record.id) ?? 0;
  usageAuditMemory.set(record.id, now);
  if (usageAuditMemory.size > 20_000) usageAuditMemory.clear();

  await prisma.apiKey
    .updateMany({
      where: { id: record.id, revokedAt: null },
      data: { lastUsedAt: new Date(now) },
    })
    .catch(() => undefined);

  if (now - lastAudit >= USAGE_AUDIT_THROTTLE_MS) {
    await createAuditLog({
      communityId: record.communityId,
      userId: null,
      eventType: AuditEvent.API_KEY_USED,
      metadata: { apiKeyId: record.id, source: "api_key_auth" },
    });
  }

  return {
    id: record.id,
    communityId: record.communityId,
    name: record.name,
    permissions,
  };
}
