import { createHash } from "crypto";
import { Prisma } from "@prisma/client";

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (t === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(String(value));
}

export function computeAuditHash(input: {
  prevHash: string | null;
  chainIndex: number;
  communityId: string | null;
  userId: string | null;
  eventType: string;
  ip: string | null;
  userAgent: string | null;
  metadata: Prisma.InputJsonValue | null;
  createdAt: Date;
}) {
  const eventData = stableStringify({
    chainIndex: input.chainIndex,
    communityId: input.communityId,
    userId: input.userId,
    eventType: input.eventType,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: input.metadata,
    createdAt: input.createdAt.toISOString(),
  });

  const seed = `${input.prevHash ?? ""}${eventData}`;
  return createHash("sha256").update(seed).digest("hex");
}
