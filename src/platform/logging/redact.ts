const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "authorization",
  "cookie",
  "setcookie",
  "apikey",
  "accesstoken",
  "refreshtoken",
  "card",
  "cardnumber",
  "cvv",
  "cvc",
  "pan",
  "aadhaar",
  "aadhar",
  "otp",
  "gstin",
  "privatekey",
  "credential",
  "credentials",
  "session",
  "pin",
]);

const BEARER_PATTERN = /bearer\s+\S+/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const CARD_PATTERN = /\b\d{13,19}\b/g;

export function scrubString(value: string): string {
  return value
    .replace(BEARER_PATTERN, "bearer [redacted]")
    .replace(JWT_PATTERN, "[redacted]")
    .replace(CARD_PATTERN, "[redacted]");
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(normalizeKey(key));
}

export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    return scrubString(value);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return "[circular]";
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    output[key] = isSensitiveKey(key) ? "[redacted]" : redact(child, seen);
  }
  return output;
}
