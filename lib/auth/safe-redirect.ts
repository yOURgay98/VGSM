const DEFAULT_FALLBACK = "/";

export function safeInternalRedirect(value: unknown, fallback: string = DEFAULT_FALLBACK): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;

  // Block protocol-relative and path traversal-ish inputs.
  if (raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }

  return raw;
}
