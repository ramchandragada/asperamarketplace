import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RazorpayPaymentProvider } from "@/modules/payments/provider";

const env = {
  RAZORPAY_KEY_ID: "rzp_test_aspera_dev",
  RAZORPAY_KEY_SECRET: "test_secret",
  RAZORPAY_WEBHOOK_SECRET: "whsec_test",
  PAYMENTS_LIVE: "false",
  NODE_ENV: "test",
};

describe("RazorpayPaymentProvider", () => {
  it("verifies webhook HMAC", () => {
    const provider = new RazorpayPaymentProvider(env);
    const body = JSON.stringify({ event: "payment.captured", id: "evt_1" });
    const sig = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");
    expect(provider.verifyWebhookSignature(body, sig)).toBe(true);
    expect(provider.verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });

  it("maps payment.captured to payment.succeeded using order_id", () => {
    const provider = new RazorpayPaymentProvider(env);
    const payload = provider.parseWebhook(
      JSON.stringify({
        id: "evt_capt_1",
        event: "payment.captured",
        created_at: 1_700_000_000,
        payload: {
          payment: {
            entity: {
              id: "pay_abc",
              order_id: "order_xyz",
              amount: 49900,
              currency: "INR",
              status: "captured",
            },
          },
        },
      }),
    );
    expect(payload.type).toBe("payment.succeeded");
    expect(payload.data.providerReference).toBe("order_xyz");
    expect(payload.data.amountPaise).toBe(49900);
  });

  it("maps payment.failed", () => {
    const provider = new RazorpayPaymentProvider(env);
    const payload = provider.parseWebhook(
      JSON.stringify({
        id: "evt_fail_1",
        event: "payment.failed",
        created_at: 1_700_000_000,
        payload: {
          payment: {
            entity: {
              id: "pay_fail",
              order_id: "order_fail",
              amount: 100,
              currency: "INR",
              status: "failed",
              error_description: "Payment cancelled by user",
            },
          },
        },
      }),
    );
    expect(payload.type).toBe("payment.failed");
    expect(payload.data.failureReason).toMatch(/cancelled/i);
  });
});
