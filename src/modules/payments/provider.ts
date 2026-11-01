import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export type PaymentCreateInput = {
  amountPaise: number;
  currencyCode: string;
  orderId: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
};

export type PaymentCreateResult = {
  provider: "mock" | "razorpay";
  providerReference: string;
  clientSecret: string | null;
  status: "pending";
  amountPaise: number;
  currencyCode: string;
  /** Razorpay key id for Checkout.js — null for mock. */
  publicKey?: string | null;
};

export type PaymentWebhookPayload = {
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
  readonly name: "mock" | "razorpay";
  createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
  parseWebhook(rawBody: string): PaymentWebhookPayload;
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
  readonly name = "mock" as const;

  async createPayment(
    input: PaymentCreateInput,
  ): Promise<PaymentCreateResult> {
    const providerReference = `mock_pay_${randomBytes(12).toString("hex")}`;
    const clientSecret = `mock_secret_${randomBytes(16).toString("hex")}`;
    return {
      provider: "mock",
      providerReference,
      clientSecret,
      status: "pending",
      amountPaise: input.amountPaise,
      currencyCode: input.currencyCode,
      publicKey: null,
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

  parseWebhook(rawBody: string): PaymentWebhookPayload {
    const parsed = JSON.parse(rawBody) as PaymentWebhookPayload;
    if (!parsed.id || !parsed.type || !parsed.data?.providerReference) {
      throw new Error("Invalid mock webhook payload");
    }
    return parsed;
  }
}

type RazorpayEnv = {
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  PAYMENTS_LIVE?: string;
  NODE_ENV?: string;
};

function razorpayCredentials(env: RazorpayEnv = process.env): {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
} {
  const keyId = env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  if (!keyId || !keySecret || !webhookSecret) {
    throw new Error(
      "RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET are required",
    );
  }
  const live = env.PAYMENTS_LIVE === "true";
  const isTestKey = keyId.startsWith("rzp_test_");
  if (live && isTestKey && env.NODE_ENV === "production") {
    throw new Error(
      "PAYMENTS_LIVE=true requires live Razorpay keys (rzp_live_*), not test keys",
    );
  }
  if (!live && env.NODE_ENV === "production" && !isTestKey) {
    // Allow live keys only when flag is on — avoid accidental live charges.
    throw new Error(
      "Set PAYMENTS_LIVE=true before using live Razorpay keys in production",
    );
  }
  return { keyId, keySecret, webhookSecret };
}

/**
 * Razorpay Orders + webhook verification.
 * Paid status must come from payment.captured webhook — never from client success alone.
 */
export class RazorpayPaymentProvider implements PaymentProviderPort {
  readonly name = "razorpay" as const;

  constructor(private readonly env: RazorpayEnv = process.env) {}

  async createPayment(
    input: PaymentCreateInput,
  ): Promise<PaymentCreateResult> {
    const { keyId, keySecret } = razorpayCredentials(this.env);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const receipt = `asp_${input.orderId.replace(/-/g, "").slice(0, 20)}`;
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currencyCode || "INR",
        receipt,
        notes: {
          aspera_order_id: input.orderId,
          idempotency_key: input.idempotencyKey,
          ...(input.metadata ?? {}),
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Razorpay order create failed (${response.status}): ${text.slice(0, 200)}`);
    }
    const body = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };
    return {
      provider: "razorpay",
      providerReference: body.id,
      // Checkout.js uses order_id + key_id; store key id in clientSecret slot
      // for the existing PaymentAttempt.clientSecret column.
      clientSecret: keyId,
      status: "pending",
      amountPaise: body.amount,
      currencyCode: body.currency,
      publicKey: keyId,
    };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const { webhookSecret } = razorpayCredentials(this.env);
    const expected = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");
    const provided = signatureHeader.trim();
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(provided, "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseWebhook(rawBody: string): PaymentWebhookPayload {
    const envelope = JSON.parse(rawBody) as {
      event?: string;
      id?: string;
      created_at?: number;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            currency?: string;
            status?: string;
            error_description?: string | null;
          };
        };
        order?: { entity?: { id?: string; amount?: number; currency?: string } };
      };
    };

    const event = envelope.event ?? "";
    const payment = envelope.payload?.payment?.entity;
    const order = envelope.payload?.order?.entity;
    const providerReference =
      payment?.order_id ?? order?.id ?? payment?.id ?? "";
    if (!envelope.id || !providerReference) {
      throw new Error("Invalid Razorpay webhook payload");
    }

    const amountPaise = payment?.amount ?? order?.amount ?? 0;
    const currencyCode = (
      payment?.currency ??
      order?.currency ??
      "INR"
    ).toUpperCase();

    if (
      event === "payment.captured" ||
      event === "order.paid" ||
      payment?.status === "captured"
    ) {
      return {
        id: envelope.id,
        type: "payment.succeeded",
        createdAt: new Date((envelope.created_at ?? 0) * 1000).toISOString(),
        data: {
          providerReference,
          amountPaise,
          currencyCode,
        },
      };
    }

    if (
      event === "payment.failed" ||
      payment?.status === "failed"
    ) {
      return {
        id: envelope.id,
        type: "payment.failed",
        createdAt: new Date((envelope.created_at ?? 0) * 1000).toISOString(),
        data: {
          providerReference,
          amountPaise,
          currencyCode,
          failureReason:
            payment?.error_description ?? "Razorpay payment failed",
        },
      };
    }

    throw new Error(`Unhandled Razorpay webhook event: ${event || "unknown"}`);
  }
}

type PaymentEnv = {
  PAYMENT_PROVIDER?: string;
  ALLOW_MOCK_SELF_PAY?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
  PAYMENTS_LIVE?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
};

/**
 * Select the active payment provider.
 * `mock` — development / until Razorpay KYC keys are set.
 * `razorpay` — Orders API + webhook; paid only via verified webhook.
 */
export function getPaymentProvider(
  env: PaymentEnv = process.env,
): PaymentProviderPort {
  const selected = (env.PAYMENT_PROVIDER ?? "mock").trim().toLowerCase();
  if (selected === "mock" || selected === "") {
    return new MockPaymentProvider();
  }
  if (selected === "razorpay") {
    return new RazorpayPaymentProvider(env);
  }
  throw new Error(
    `Unsupported PAYMENT_PROVIDER="${selected}". Use "mock" or "razorpay".`,
  );
}

export function paymentsAreMockOnly(env: PaymentEnv = process.env): boolean {
  try {
    return getPaymentProvider(env) instanceof MockPaymentProvider;
  } catch {
    return false;
  }
}

/**
 * Whether the authenticated `POST /api/payments/mock-complete` path may run.
 * Never on Vercel production. Closed when provider is not mock.
 */
export function mockSelfPayAllowed(env: PaymentEnv = process.env): boolean {
  if (!paymentsAreMockOnly(env)) return false;
  if (env.VERCEL_ENV === "production") return false;
  if (env.NODE_ENV === "production") {
    return env.ALLOW_MOCK_SELF_PAY === "true";
  }
  return true;
}

/** @deprecated Use PaymentWebhookPayload */
export type MockWebhookPayload = PaymentWebhookPayload;
/** @deprecated Use PaymentCreateInput */
export type MockPaymentCreateInput = PaymentCreateInput;
/** @deprecated Use PaymentCreateResult */
export type MockPaymentCreateResult = PaymentCreateResult;
