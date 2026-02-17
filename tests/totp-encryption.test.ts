import { describe, expect, it, vi, afterEach } from "vitest";
import { generateSync } from "otplib";

import { decryptString, encryptString } from "../lib/security/encryption";
import { verifyTotp } from "../lib/security/totp";

afterEach(() => {
  vi.useRealTimers();
});

describe("encryption", () => {
  it("round-trips plaintext", () => {
    process.env.AUTH_ENCRYPTION_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="; // 32 bytes of zeroes (base64)
    const enc = encryptString("hello");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(decryptString(enc)).toBe("hello");
  });
});

describe("TOTP verification", () => {
  it("verifies a valid code", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const secret = "KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD";
    const token = generateSync({ secret, digits: 6, period: 30 });

    expect(verifyTotp(token, secret)).toBe(true);
  });

  it("rejects invalid codes", () => {
    expect(verifyTotp("not-a-code", "SECRET")).toBe(false);
    expect(verifyTotp("123", "SECRET")).toBe(false);
  });
});
