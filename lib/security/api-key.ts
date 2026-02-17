import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashApiKey(rawKey: string) {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey() {
  // URL-safe token suitable for headers/env vars.
  const key = randomBytes(32).toString("base64url");
  return { key, keyHash: hashApiKey(key) };
}

export function verifyApiKey(rawKey: string, expectedHash: string) {
  try {
    const actual = Buffer.from(hashApiKey(rawKey), "hex");
    const expected = Buffer.from(expectedHash, "hex");
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
