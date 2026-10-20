import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const PERIOD_SECONDS = 30;
const DIGITS = 6;
const WINDOW = 1;

function encryptionKey(): Buffer {
  const raw =
    process.env.TOTP_ENCRYPTION_KEY ??
    process.env.DATABASE_URL ??
    "aspera-dev-totp-key";
  return createHmac("sha256", "aspera-totp").update(raw).digest();
}

export function generateTotpSecret(): string {
  return randomBytes(20).toString("base64url");
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptTotpSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

function hotp(secret: Buffer, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", secret).update(counterBuf).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0");
}

function secretToBuffer(secret: string): Buffer {
  // Accept base64url secrets from generateTotpSecret
  return Buffer.from(secret, "base64url");
}

export function verifyTotpCode(
  secret: string,
  code: string,
  atMs = Date.now(),
): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const secretBuf = secretToBuffer(secret);
  const counter = Math.floor(atMs / 1000 / PERIOD_SECONDS);
  for (let drift = -WINDOW; drift <= WINDOW; drift += 1) {
    const expected = hotp(secretBuf, counter + drift);
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(cleaned, "utf8");
    if (left.length === right.length && timingSafeEqual(left, right)) {
      return true;
    }
  }
  return false;
}

export function totpUri(input: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  const issuer = encodeURIComponent(input.issuer ?? "Aspera Marketplace");
  const label = encodeURIComponent(`Aspera:${input.email}`);
  // Google Authenticator expects base32; we expose a hex/base64url secret via
  // manual entry. For URI, encode secret as standard base32 from raw bytes.
  const base32 = toBase32(secretToBuffer(input.secret));
  return `otpauth://totp/${label}?secret=${base32}&issuer=${issuer}&digits=${DIGITS}&period=${PERIOD_SECONDS}`;
}

function toBase32(buf: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

/** Short-lived signed challenge after password OK, before TOTP. */
export function issueTotpChallenge(userId: string, ttlMs = 5 * 60 * 1000): string {
  const exp = Date.now() + ttlMs;
  const payload = Buffer.from(
    JSON.stringify({ userId, exp }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", encryptionKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyTotpChallenge(token: string): string | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", encryptionKey())
    .update(payload)
    .digest("base64url");
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(sig, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { userId?: string; exp?: number };
    if (!data.userId || !data.exp || data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}
