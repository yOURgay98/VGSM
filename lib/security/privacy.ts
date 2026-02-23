const IPV4_RE = /^(\d{1,3})(?:\.(\d{1,3})){3}$/;

const REDACTED = "[REDACTED]";
const MAX_METADATA_DEPTH = 5;
const MAX_METADATA_ARRAY = 100;

const SENSITIVE_KEY_PARTS = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "accesskey",
  "keyhash",
  "rawkey",
  "authorization",
  "cookie",
  "set-cookie",
  "bearer",
];

function normalizeIp(raw: string | null | undefined) {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.includes(",")) return value.split(",")[0]?.trim() ?? null;
  return value;
}

export function maskIpAddress(raw: string | null | undefined): string | null {
  const ip = normalizeIp(raw);
  if (!ip) return null;

  if (IPV4_RE.test(ip)) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
  }

  // IPv6 or unknown format.
  if (ip.includes(":")) {
    const segs = ip.split(":").filter(Boolean);
    const a = segs[0] ?? "xxxx";
    const b = segs[1] ?? "xxxx";
    return `${a}:${b}:xxxx:xxxx`;
  }

  // Unknown token format; never return raw.
  return "masked";
}

export function sanitizeUserAgent(raw: string | null | undefined): string | null {
  const ua = (raw ?? "").trim();
  if (!ua) return null;
  if (ua.length <= 220) return ua;
  return `${ua.slice(0, 220)}...`;
}

function shouldRedactKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function sanitizeStringByKey(value: string, keyHint?: string) {
  if (keyHint && shouldRedactKey(keyHint)) return REDACTED;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || value.includes(":")) {
    const masked = maskIpAddress(value);
    if (masked) return masked;
  }
  return value;
}

function sanitizeUnknown(value: unknown, depth: number, keyHint?: string): unknown {
  if (depth > MAX_METADATA_DEPTH) return "[TRUNCATED]";
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    return sanitizeStringByKey(value, keyHint);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_METADATA_ARRAY).map((entry) => sanitizeUnknown(entry, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (shouldRedactKey(k)) {
        out[k] = REDACTED;
        continue;
      }
      out[k] = sanitizeUnknown(v, depth + 1, k);
    }
    return out;
  }

  return String(value);
}

export function sanitizeMetadata(value: unknown): unknown {
  return sanitizeUnknown(value, 0);
}
