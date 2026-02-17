import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;

function loadKey(): Buffer {
  const raw = process.env.AUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("AUTH_ENCRYPTION_KEY is not set.");
  }

  const trimmed = raw.trim();
  const isHex = /^[0-9a-fA-F]+$/.test(trimmed);

  let buf: Buffer;
  if (isHex && trimmed.length === 64) {
    buf = Buffer.from(trimmed, "hex");
  } else {
    buf = Buffer.from(trimmed, "base64");
  }

  if (buf.length !== 32) {
    throw new Error("AUTH_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return buf;
}

export function encryptString(plaintext: string) {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // v1 payload: iv(12) + tag(16) + ciphertext
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return `v1:${payload}`;
}

export function decryptString(payload: string) {
  const key = loadKey();
  const [version, b64] = payload.split(":", 2);
  if (version !== "v1" || !b64) {
    throw new Error("Invalid encrypted payload.");
  }

  const buf = Buffer.from(b64, "base64");
  if (buf.length < IV_BYTES + 16 + 1) {
    throw new Error("Invalid encrypted payload.");
  }

  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + 16);
  const ciphertext = buf.subarray(IV_BYTES + 16);

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
