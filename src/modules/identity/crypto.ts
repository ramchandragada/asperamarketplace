import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return "[redacted-email]";
  }
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskPan(pan: string): string {
  const cleaned = pan.replace(/\s+/g, "").toUpperCase();
  return cleaned.slice(-4);
}

export function maskGstin(gstin: string): string {
  const cleaned = gstin.replace(/\s+/g, "").toUpperCase();
  if (cleaned.length < 8) {
    return "****";
  }
  return `${cleaned.slice(0, 2)}****${cleaned.slice(-4)}`;
}
