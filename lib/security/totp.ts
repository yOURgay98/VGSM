import { generateSecret, generateURI, verifySync } from "otplib";

const TOTP_OPTIONS = {
  digits: 6,
  period: 30,
  window: 1,
} as const;

export function generateTotpSecret() {
  return generateSecret();
}

export function buildOtpAuthUrl(input: { issuer: string; accountName: string; secret: string }) {
  return generateURI({
    issuer: input.issuer,
    label: input.accountName,
    secret: input.secret,
    digits: TOTP_OPTIONS.digits,
    period: TOTP_OPTIONS.period,
  });
}

export function verifyTotp(code: string, secret: string) {
  const token = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) {
    return false;
  }
  return verifySync({
    token,
    secret,
    // `window` is supported at runtime but isn't currently typed in the upstream defs.
    window: TOTP_OPTIONS.window,
    digits: TOTP_OPTIONS.digits,
    period: TOTP_OPTIONS.period,
  } as any).valid;
}
