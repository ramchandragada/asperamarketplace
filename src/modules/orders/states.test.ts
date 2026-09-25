import { describe, expect, it } from "vitest";
import { MockPaymentProvider } from "@/modules/payments/provider";
import {
  assertOrderTransition,
  assertPaymentTransition,
  OrderTransitionError,
} from "@/modules/orders/states";

describe("payment provider mock", () => {
  it("signs and verifies webhooks; rejects tampering", async () => {
    const provider = new MockPaymentProvider();
    const created = await provider.createPayment({
      amountPaise: 10000,
      currencyCode: "INR",
      orderId: "order-1",
      idempotencyKey: "key-1",
    });
    const payload = JSON.stringify({
      id: "evt_1",
      type: "payment.succeeded",
      createdAt: new Date().toISOString(),
      data: {
        providerReference: created.providerReference,
        amountPaise: 10000,
        currencyCode: "INR",
      },
    });
    const signature = provider.signPayload(payload);
    expect(provider.verifyWebhookSignature(payload, `sha256=${signature}`)).toBe(
      true,
    );
    expect(provider.verifyWebhookSignature(payload, "sha256=deadbeef")).toBe(
      false,
    );
  });
});

describe("order state machine", () => {
  it("allows awaiting_payment to paid and rejects illegal jumps", () => {
    expect(() => assertOrderTransition("awaiting_payment", "paid")).not.toThrow();
    expect(() => assertOrderTransition("paid", "awaiting_payment")).toThrow(
      OrderTransitionError,
    );
    expect(() => assertPaymentTransition("pending", "succeeded")).not.toThrow();
  });
});
