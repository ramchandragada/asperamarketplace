import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export type MockPaymentCreateInput = {
  amountPaise: number;
  currencyCode: string;
  orderId: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type MockPaymentCreateResult = {
  provider: "mock";
  providerReference: string;
  clientSecret: string;
  status: "pending";
  amountPaise: number;
  currencyCode: string;
};

export type MockWebhookPayload = {
  id: string;
  type: "payment.succeeded" | "payment.failed";
  createdAt: string;
  data: {
    providerReference: string;
    amountPaise: number;
    currencyCode: string;
    failureReason?: string;
  };
};

export interface PaymentProviderPort {
  createPayment(input: MockPaymentCreateInput): Promise<MockPaymentCreateResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
  parseWebhook(rawBody: string): MockWebhookPayload;
}

export const DEV_MOCK_WEBHOOK_SECRET =
  "aspera-mock-webhook-dev-only-not-secret";

/**
 * Production must not sign or accept webhooks with the documented dev default.
 * Returns null when the secret is missing or still the public placeholder.
 */
export function resolveMockWebhookSecret(
  env: { NODE_ENV?: string; MOCK_PAYMENT_WEBHOOK_SECRET?: string } = process.env,
): string | null {
  const configured = env.MOCK_PAYMENT_WEBHOOK_SECRET?.trim() ?? "";
  if (env.NODE_ENV === "production") {
    if (!configured || configured === DEV_MOCK_WEBHOOK_SECRET) return null;
    return configured;
  }
  return configured || DEV_MOCK_WEBHOOK_SECRET;
}

function getMockWebhookSecret(): string {
  const secret = resolveMockWebhookSecret();
  if (!secret) {
    throw new Error("MOCK_PAYMENT_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export class MockPaymentProvider implements PaymentProviderPort {
  async createPayment(
    input: MockPaymentCreateInput,
  ): Promise<MockPaymentCreateResult> {
    const providerReference = `mock_pay_${randomBytes(12).toString("hex")}`;
    const clientSecret = `mock_secret_${randomBytes(16).toString("hex")}`;
    return {
      provider: "mock",
      providerReference,
      clientSecret,
      status: "pending",
      amountPaise: input.amountPaise,
      currencyCode: input.currencyCode,
    };
  }

  signPayload(rawBody: string): string {
    return createHmac("sha256", getMockWebhookSecret())
      .update(rawBody)
      .digest("hex");
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const expected = this.signPayload(rawBody);
    const provided = signatureHeader.replace(/^sha256=/, "").trim();
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(provided, "hex");
      if (a.length !== b.length) {
        return false;
      }
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseWebhook(rawBody: string): MockWebhookPayload {
    const parsed = JSON.parse(rawBody) as MockWebhookPayload;
    if (!parsed.id || !parsed.type || !parsed.data?.providerReference) {
      throw new Error("Invalid mock webhook payload");
    }
    return parsed;
  }
}

type PaymentEnv = {
  PAYMENT_PROVIDER?: string;
  ALLOW_MOCK_SELF_PAY?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

/**
 * Select the active payment provider.
 * Today only mock is wired. When Razorpay (or another PA) is added, branch on
 * env (e.g. `PAYMENT_PROVIDER=razorpay`) so production cannot silently stay
 * on MockPaymentProvider after cutover.
 */
export function getPaymentProvider(
  env: PaymentEnv = process.env,
): PaymentProviderPort {
  const selected = (env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();
  if (selected === "mock" || selected === "") {
    return new MockPaymentProvider();
  }
  // Real providers land here. Until then, refuse unknown names so a mistyped
  // env var cannot leave mock self-pay open by accident.
  throw new Error(
    `Unsupported PAYMENT_PROVIDER="${selected}". Use "mock" until Razorpay is wired.`,
  );
}

/**
 * True while the live payment provider is still the mock gateway.
 */
export function paymentsAreMockOnly(env: PaymentEnv = process.env): boolean {
  try {
    return getPaymentProvider(env) instanceof MockPaymentProvider;
  } catch {
    return false;
  }
}

/**
 * Whether the authenticated demo `POST /api/payments/mock-complete` path may run.
 *
 * CTO policy (2026-10-26):
 * - Live production (`VERCEL_ENV=production`) — **never**. Buyers must not
 *   self-mark orders paid. `ALLOW_MOCK_SELF_PAY` is ignored there.
 * - Preview / local / test — allowed while the provider is still mock.
 * - `ALLOW_MOCK_SELF_PAY=true` only unlocks mock self-pay when `NODE_ENV` is
 *   production **and** `VERCEL_ENV` is not `production` (e.g. a mis-labelled
 *   local build). Prefer unset.
 */
export function mockSelfPayAllowed(env: PaymentEnv = process.env): boolean {
  if (!paymentsAreMockOnly(env)) return false;
  // Absolute ban on the live production deployment — Grok P0-1.
  if (env.VERCEL_ENV === "production") return false;
  if (env.NODE_ENV === "production") {
    return env.ALLOW_MOCK_SELF_PAY === "true";
  }
  return true;
}
