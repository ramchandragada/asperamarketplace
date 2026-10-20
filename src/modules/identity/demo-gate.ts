/**
 * Seeded `@aspera.local` accounts are for local/demo only.
 * In production they are blocked unless ALLOW_DEMO_LOGINS=true.
 */
export function isDemoEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@aspera.local");
}

export function demoLoginsAllowed(): boolean {
  if (process.env.ALLOW_DEMO_LOGINS === "true") return true;
  if (process.env.ALLOW_DEMO_LOGINS === "false") return false;
  // Preview / local stay usable for QA; production requires explicit override.
  return process.env.VERCEL_ENV !== "production";
}

export function assertDemoLoginAllowed(email: string) {
  if (isDemoEmail(email) && !demoLoginsAllowed()) {
    throw new DemoLoginBlockedError();
  }
}

export class DemoLoginBlockedError extends Error {
  readonly code = "DEMO_LOGIN_BLOCKED";
  constructor() {
    super(
      "Demo accounts are disabled in production. Sign in with a real account.",
    );
    this.name = "DemoLoginBlockedError";
  }
}
