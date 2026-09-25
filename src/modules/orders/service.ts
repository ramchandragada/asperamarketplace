import { createHash } from "node:crypto";
import { prisma } from "@/platform/db/prisma";
import type { Actor } from "@/modules/identity/policy";
import type { CheckoutSnapshot } from "@/modules/cart/pricing";
import {
  beginIdempotentCommand,
  completeIdempotentCommand,
} from "@/platform/idempotency/store";
import {
  getPaymentProvider,
  MockPaymentProvider,
  type MockWebhookPayload,
} from "@/modules/payments/provider";
import { getNotificationPort } from "@/platform/notifications/port";
import {
  assertOrderTransition,
  assertPaymentTransition,
} from "@/modules/orders/states";
import type {
  CreateOrderFromCheckoutInput,
  MockCompletePaymentInput,
  StartPaymentInput,
} from "@/modules/orders/schema";
import { LocalObjectStorage } from "@/platform/storage/local";
import path from "node:path";

export class OrderValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export class OrderConflictError extends Error {
  readonly code = "CONFLICT";
  constructor(message: string) {
    super(message);
    this.name = "OrderConflictError";
  }
}

export class WebhookRejectedError extends Error {
  readonly code = "WEBHOOK_REJECTED";
  constructor(message: string) {
    super(message);
    this.name = "WebhookRejectedError";
  }
}

function orderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `ASP-${stamp}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function invoiceNumber(orderNumberValue: string): string {
  return `INV-${orderNumberValue}`;
}

export async function createOrderFromCheckout(
  actor: Actor,
  input: CreateOrderFromCheckoutInput,
  correlationId: string,
) {
  type Result = { order: Awaited<ReturnType<typeof serializeOrder>> };
  const idem = await beginIdempotentCommand<Result>({
    key: input.idempotencyKey,
    scope: `order-create:${actor.userId}`,
    requestPayload: { checkoutSessionId: input.checkoutSessionId },
  });
  if (idem.kind === "cached") {
    return idem.body;
  }

  const checkout = await prisma.checkoutSession.findFirst({
    where: { id: input.checkoutSessionId, userId: actor.userId },
  });
  if (!checkout) {
    throw new OrderValidationError("Checkout session not found");
  }
  if (checkout.status !== "reserved") {
    throw new OrderValidationError(
      "Checkout must be reserved before creating an order",
    );
  }
  if (checkout.reservedUntil && checkout.reservedUntil < new Date()) {
    throw new OrderValidationError("Checkout reservation has expired");
  }

  const existing = await prisma.order.findUnique({
    where: { checkoutSessionId: checkout.id },
  });
  if (existing) {
    const body = { order: await serializeOrder(existing.id) };
    await completeIdempotentCommand({
      key: input.idempotencyKey,
      scope: `order-create:${actor.userId}`,
      responseCode: "OK",
      responseBody: body,
    });
    return body;
  }

  const snapshot = checkout.snapshot as CheckoutSnapshot;
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId: actor.userId,
        checkoutSessionId: checkout.id,
        addressId: checkout.addressId,
        status: "awaiting_payment",
        snapshot,
        subtotalPaise: checkout.subtotalPaise,
        discountPaise: checkout.discountPaise,
        shippingPaise: checkout.shippingPaise,
        taxPaise: checkout.taxPaise,
        totalPaise: checkout.totalPaise,
      },
    });

    for (const group of snapshot.groups) {
      const fulfilment = await tx.orderFulfilmentGroup.create({
        data: {
          orderId: order.id,
          sellerId: group.sellerId,
          status: "pending",
          lineTotalPaise: group.lineTotalPaise,
          shippingPaise: 0,
        },
      });
      const groupLines = snapshot.lines.filter(
        (line) => line.sellerId === group.sellerId,
      );
      for (const line of groupLines) {
        await tx.orderLine.create({
          data: {
            orderId: order.id,
            fulfilmentGroupId: fulfilment.id,
            sellerId: line.sellerId,
            productId: line.productId,
            variantId: line.variantId,
            productTitle: line.productTitle,
            variantTitle: line.variantTitle,
            sku: line.sku,
            quantity: line.quantity,
            unitPricePaise: line.unitPricePaise,
            lineTotalPaise: line.lineTotalPaise,
          },
        });
      }
    }

    await tx.checkoutSession.update({
      where: { id: checkout.id },
      data: { status: "converted", version: { increment: 1 } },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "order.created",
        targetType: "order",
        targetId: order.id,
        afterState: {
          orderNumber: order.orderNumber,
          status: order.status,
          totalPaise: order.totalPaise,
        },
        reason: "Order created from reserved checkout",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "OrderCreated",
        aggregateType: "order",
        aggregateId: order.id,
        payload: {
          orderNumber: order.orderNumber,
          totalPaise: order.totalPaise,
          userId: actor.userId,
        },
      },
    });
    return order;
  });

  const body = { order: await serializeOrder(created.id) };
  await completeIdempotentCommand({
    key: input.idempotencyKey,
    scope: `order-create:${actor.userId}`,
    responseCode: "OK",
    responseBody: body,
  });
  return body;
}

export async function startPayment(
  actor: Actor,
  input: StartPaymentInput,
  correlationId: string,
) {
  type Result = {
    payment: {
      id: string;
      status: string;
      providerReference: string;
      clientSecret: string | null;
      amountPaise: number;
    };
  };
  const idem = await beginIdempotentCommand<Result>({
    key: input.idempotencyKey,
    scope: `payment-start:${actor.userId}`,
    requestPayload: { orderId: input.orderId },
  });
  if (idem.kind === "cached") {
    return idem.body;
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: actor.userId },
  });
  if (!order) {
    throw new OrderValidationError("Order not found");
  }
  if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
    throw new OrderValidationError("Order is not payable in its current state");
  }

  const provider = getPaymentProvider();
  const created = await provider.createPayment({
    amountPaise: order.totalPaise,
    currencyCode: order.currencyCode,
    orderId: order.id,
    idempotencyKey: input.idempotencyKey,
  });

  const payment = await prisma.$transaction(async (tx) => {
    if (order.status === "payment_failed") {
      assertOrderTransition(order.status, "awaiting_payment");
      await tx.order.update({
        where: { id: order.id, version: order.version },
        data: {
          status: "awaiting_payment",
          statusReason: null,
          version: { increment: 1 },
        },
      });
    }

    const attempt = await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        userId: actor.userId,
        provider: created.provider,
        providerReference: created.providerReference,
        status: "pending",
        amountPaise: created.amountPaise,
        currencyCode: created.currencyCode,
        clientSecret: created.clientSecret,
        idempotencyKey: input.idempotencyKey,
        rawCreateResponse: created,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "payment.started",
        targetType: "payment_attempt",
        targetId: attempt.id,
        afterState: {
          providerReference: attempt.providerReference,
          amountPaise: attempt.amountPaise,
          status: attempt.status,
        },
        reason: "Mock payment attempt created",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "PaymentAttemptCreated",
        aggregateType: "payment_attempt",
        aggregateId: attempt.id,
        payload: {
          orderId: order.id,
          providerReference: attempt.providerReference,
        },
      },
    });
    return attempt;
  });

  const body = {
    payment: {
      id: payment.id,
      status: payment.status,
      providerReference: payment.providerReference,
      clientSecret: payment.clientSecret,
      amountPaise: payment.amountPaise,
    },
  };
  await completeIdempotentCommand({
    key: input.idempotencyKey,
    scope: `payment-start:${actor.userId}`,
    responseCode: "OK",
    responseBody: body,
  });
  return body;
}

/** Development helper: emit a signed mock webhook for an outcome. */
export async function simulateMockPaymentOutcome(
  actor: Actor,
  input: MockCompletePaymentInput,
  correlationId: string,
) {
  const payment = await prisma.paymentAttempt.findFirst({
    where: { id: input.paymentAttemptId, userId: actor.userId },
  });
  if (!payment) {
    throw new OrderValidationError("Payment attempt not found");
  }

  const provider = new MockPaymentProvider();
  const payload: MockWebhookPayload = {
    id: `evt_${crypto.randomUUID()}`,
    type: input.outcome === "succeeded" ? "payment.succeeded" : "payment.failed",
    createdAt: new Date().toISOString(),
    data: {
      providerReference: payment.providerReference,
      amountPaise: payment.amountPaise,
      currencyCode: payment.currencyCode,
      failureReason:
        input.outcome === "failed"
          ? (input.failureReason ?? "Mock payment declined")
          : undefined,
    },
  };
  const rawBody = JSON.stringify(payload);
  const signature = provider.signPayload(rawBody);
  return processPaymentWebhook({
    rawBody,
    signatureHeader: `sha256=${signature}`,
    correlationId,
  });
}

export async function processPaymentWebhook(input: {
  rawBody: string;
  signatureHeader: string;
  correlationId: string;
}) {
  const provider = new MockPaymentProvider();
  const signatureValid = provider.verifyWebhookSignature(
    input.rawBody,
    input.signatureHeader,
  );
  if (!signatureValid) {
    throw new WebhookRejectedError("Invalid webhook signature");
  }

  let payload: MockWebhookPayload;
  try {
    payload = provider.parseWebhook(input.rawBody);
  } catch {
    throw new WebhookRejectedError("Malformed webhook payload");
  }

  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: "mock",
        providerEventId: payload.id,
      },
    },
  });
  if (existing?.processed) {
    return {
      replayed: true,
      eventId: existing.id,
      orderId: null as string | null,
      status: "already_processed",
    };
  }

  const payment = await prisma.paymentAttempt.findUnique({
    where: { providerReference: payload.data.providerReference },
    include: { order: true },
  });
  if (!payment) {
    throw new WebhookRejectedError("Unknown payment reference");
  }
  if (payment.amountPaise !== payload.data.amountPaise) {
    throw new WebhookRejectedError("Webhook amount does not match payment");
  }

  if (existing && !existing.processed) {
    // continue processing
  } else if (!existing) {
    try {
      await prisma.paymentWebhookEvent.create({
        data: {
          provider: "mock",
          providerEventId: payload.id,
          paymentAttemptId: payment.id,
          eventType: payload.type,
          payloadHash,
          signatureValid: true,
          processed: false,
          rawPayload: payload,
        },
      });
    } catch {
      const raced = await prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_providerEventId: {
            provider: "mock",
            providerEventId: payload.id,
          },
        },
      });
      if (raced?.processed) {
        return {
          replayed: true,
          eventId: raced.id,
          orderId: payment.orderId,
          status: "already_processed",
        };
      }
    }
  }

  if (payload.type === "payment.succeeded") {
    await markPaymentSucceeded(payment.id, payload.id, input.correlationId);
  } else {
    await markPaymentFailed(
      payment.id,
      payload.id,
      payload.data.failureReason ?? "Payment failed",
      input.correlationId,
    );
  }

  const event = await prisma.paymentWebhookEvent.findUniqueOrThrow({
    where: {
      provider_providerEventId: {
        provider: "mock",
        providerEventId: payload.id,
      },
    },
  });

  return {
    replayed: false,
    eventId: event.id,
    orderId: payment.orderId,
    status: payload.type,
  };
}

async function markPaymentSucceeded(
  paymentAttemptId: string,
  providerEventId: string,
  correlationId: string,
) {
  const payment = await prisma.paymentAttempt.findUniqueOrThrow({
    where: { id: paymentAttemptId },
    include: {
      order: {
        include: { lines: true, user: true, address: true },
      },
    },
  });

  if (payment.status === "succeeded") {
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "mock",
          providerEventId,
        },
      },
      data: { processed: true, processedAt: new Date() },
    });
    return;
  }

  assertPaymentTransition(payment.status, "succeeded");
  assertOrderTransition(payment.order.status, "paid");

  await prisma.$transaction(async (tx) => {
    await tx.paymentAttempt.update({
      where: { id: payment.id, version: payment.version },
      data: {
        status: "succeeded",
        paidAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.order.update({
      where: { id: payment.orderId, version: payment.order.version },
      data: {
        status: "paid",
        paidAt: new Date(),
        version: { increment: 1 },
      },
    });

    for (const line of payment.order.lines) {
      const inventory = await tx.inventoryItem.findUnique({
        where: { variantId: line.variantId },
      });
      if (!inventory || inventory.reserved < line.quantity) {
        throw new OrderConflictError(
          `Cannot commit stock for ${line.sku}: reservation missing`,
        );
      }
      const updated = await tx.inventoryItem.updateMany({
        where: { id: inventory.id, version: inventory.version },
        data: {
          onHand: { decrement: line.quantity },
          reserved: { decrement: line.quantity },
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new OrderConflictError("Inventory conflict while committing sale");
      }
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventory.id,
          movementType: "sale",
          quantity: line.quantity,
          reason: `Order ${payment.order.orderNumber} paid`,
          actorId: payment.userId,
          correlationId,
        },
      });
    }

    const document = {
      invoiceNumber: invoiceNumber(payment.order.orderNumber),
      orderNumber: payment.order.orderNumber,
      issuedAt: new Date().toISOString(),
      buyer: {
        userId: payment.order.userId,
        email: payment.order.user.email,
        name: payment.order.user.displayName,
      },
      shipTo: {
        fullName: payment.order.address.fullName,
        line1: payment.order.address.line1,
        line2: payment.order.address.line2,
        city: payment.order.address.city,
        state: payment.order.address.state,
        postalCode: payment.order.address.postalCode,
        country: payment.order.address.country,
      },
      lines: payment.order.lines.map((line) => ({
        sku: line.sku,
        title: `${line.productTitle} / ${line.variantTitle}`,
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise,
        lineTotalPaise: line.lineTotalPaise,
      })),
      totals: {
        subtotalPaise: payment.order.subtotalPaise,
        discountPaise: payment.order.discountPaise,
        shippingPaise: payment.order.shippingPaise,
        taxPaise: payment.order.taxPaise,
        totalPaise: payment.order.totalPaise,
      },
      disclaimer:
        "Development invoice document. Not a legally reviewed tax invoice. Seller-of-record and GST treatment remain open (A-21, A-24).",
    };

    const storageRoot =
      process.env.DOCUMENT_STORAGE_PATH ??
      path.join(process.cwd(), "uploads", "invoices");
    const storage = new LocalObjectStorage(storageRoot);
    const bytes = Buffer.from(JSON.stringify(document, null, 2), "utf8");
    const stored = await storage.put({
      namespace: "invoices",
      fileName: `${document.invoiceNumber}.json`,
      contentType: "application/json",
      bytes,
    });

    await tx.invoice.create({
      data: {
        orderId: payment.orderId,
        invoiceNumber: document.invoiceNumber,
        status: "issued",
        totalPaise: payment.order.totalPaise,
        document,
        storageKey: stored.key,
        issuedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: payment.userId,
        action: "payment.succeeded",
        targetType: "order",
        targetId: payment.orderId,
        afterState: {
          paymentAttemptId: payment.id,
          providerEventId,
          invoiceNumber: document.invoiceNumber,
        },
        reason: "Verified mock payment webhook",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "OrderPaid",
        aggregateType: "order",
        aggregateId: payment.orderId,
        payload: {
          orderNumber: payment.order.orderNumber,
          totalPaise: payment.order.totalPaise,
          invoiceNumber: document.invoiceNumber,
        },
      },
    });

    await tx.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "mock",
          providerEventId,
        },
      },
      data: { processed: true, processedAt: new Date() },
    });
  });

  const notifier = getNotificationPort();
  const sent = await notifier.send({
    channel: "email",
    recipient: payment.order.user.email,
    templateKey: "order.paid",
    payload: {
      orderNumber: payment.order.orderNumber,
      totalPaise: payment.order.totalPaise,
    },
  });
  await prisma.notificationMessage.create({
    data: {
      channel: "email",
      recipient: payment.order.user.email,
      templateKey: "order.paid",
      payload: {
        orderNumber: payment.order.orderNumber,
        totalPaise: payment.order.totalPaise,
      },
      status: "sent",
      providerRef: sent.providerRef,
      sentAt: new Date(),
    },
  });
}

async function markPaymentFailed(
  paymentAttemptId: string,
  providerEventId: string,
  failureReason: string,
  correlationId: string,
) {
  const payment = await prisma.paymentAttempt.findUniqueOrThrow({
    where: { id: paymentAttemptId },
    include: { order: { include: { lines: true } } },
  });

  if (payment.status === "failed") {
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "mock",
          providerEventId,
        },
      },
      data: { processed: true, processedAt: new Date() },
    });
    return;
  }

  assertPaymentTransition(payment.status, "failed");
  if (payment.order.status === "awaiting_payment") {
    assertOrderTransition(payment.order.status, "payment_failed");
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentAttempt.update({
      where: { id: payment.id, version: payment.version },
      data: {
        status: "failed",
        failureReason,
        failedAt: new Date(),
        version: { increment: 1 },
      },
    });

    if (payment.order.status === "awaiting_payment") {
      await tx.order.update({
        where: { id: payment.orderId, version: payment.order.version },
        data: {
          status: "payment_failed",
          statusReason: failureReason,
          version: { increment: 1 },
        },
      });

      for (const line of payment.order.lines) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { variantId: line.variantId },
        });
        if (!inventory) {
          continue;
        }
        const releaseQty = Math.min(inventory.reserved, line.quantity);
        if (releaseQty <= 0) {
          continue;
        }
        await tx.inventoryItem.update({
          where: { id: inventory.id },
          data: {
            reserved: { decrement: releaseQty },
            version: { increment: 1 },
          },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventory.id,
            movementType: "release",
            quantity: releaseQty,
            reason: `Payment failed for ${payment.order.orderNumber}`,
            actorId: payment.userId,
            correlationId,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: payment.userId,
        action: "payment.failed",
        targetType: "order",
        targetId: payment.orderId,
        afterState: { failureReason, providerEventId },
        reason: failureReason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "PaymentFailed",
        aggregateType: "order",
        aggregateId: payment.orderId,
        payload: { failureReason, paymentAttemptId: payment.id },
      },
    });
    await tx.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: "mock",
          providerEventId,
        },
      },
      data: { processed: true, processedAt: new Date() },
    });
  });
}

async function serializeOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      lines: true,
      groups: true,
      payments: { orderBy: { createdAt: "desc" } },
      invoices: true,
      address: true,
    },
  });
  return order;
}

export async function listOrdersForActor(actor: Actor) {
  return prisma.order.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      invoices: true,
      lines: true,
    },
  });
}

export async function getOrderForActor(actor: Actor, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: actor.userId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      invoices: true,
      lines: true,
      groups: { include: { shipment: true } },
      address: true,
      returnRequests: true,
      refunds: true,
    },
  });
  if (!order) {
    throw new OrderValidationError("Order not found");
  }
  return order;
}
