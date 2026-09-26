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

function getMockWebhookSecret(): string {
  return (
    process.env.MOCK_PAYMENT_WEBHOOK_SECRET ??
    "aspera-mock-webhook-dev-only-not-secret"
  );
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

export function getPaymentProvider(): PaymentProviderPort {
  return new MockPaymentProvider();
}
