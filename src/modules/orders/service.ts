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
  type PaymentWebhookPayload,
} from "@/modules/payments/provider";
import {
  buildEcoInvoiceDocument,
  renderInvoiceHtml,
} from "@/modules/orders/invoice-document";
import { computeTcsSection52 } from "@/modules/tax/tcs-section52";
import { asperaLegal } from "@/platform/config/aspera-legal";
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
import { createDocumentStorage } from "@/platform/storage/local";
import {
  createCappedLineRefund,
  ensureChartOfAccounts,
  postOrderPaidLedger,
  resolveCommissionRateBps,
} from "@/modules/finance/service";
import { availableQuantity } from "@/modules/cart/pricing";
import { releaseExpiredCheckoutReservations } from "@/modules/cart/reservations";

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
    await releaseExpiredCheckoutReservations({
      userId: actor.userId,
      force: true,
      correlationId,
    });
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
  const paymentMethod = input.paymentMethod ?? "cod";
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId: actor.userId,
        checkoutSessionId: checkout.id,
        addressId: checkout.addressId,
        status: "awaiting_payment",
        snapshot: {
          ...snapshot,
          paymentMethod,
        },
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
          paymentMethod,
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
          paymentMethod,
        },
      },
    });
    return order;
  });

  if (paymentMethod === "cod") {
    await confirmCodOrder(created.id, actor.userId, correlationId);
  }

  const body = { order: await serializeOrder(created.id) };
  await completeIdempotentCommand({
    key: input.idempotencyKey,
    scope: `order-create:${actor.userId}`,
    responseCode: "OK",
    responseBody: body,
  });
  return body;
}

/** Confirm a COD order: collect cash on delivery; no gateway capture. */
async function confirmCodOrder(
  orderId: string,
  userId: string,
  correlationId: string,
) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status !== "awaiting_payment") return;

  const providerReference = `cod_${order.id.replace(/-/g, "").slice(0, 24)}`;
  const payment = await prisma.paymentAttempt.create({
    data: {
      orderId: order.id,
      userId,
      provider: "cod",
      providerReference,
      status: "pending",
      amountPaise: order.totalPaise,
      currencyCode: order.currencyCode,
      clientSecret: null,
      idempotencyKey: `cod-${order.id}`,
      rawCreateResponse: { method: "cod" },
    },
  });

  const providerEventId = `cod_evt_${order.id}`;
  const rawPayload = JSON.stringify({
    id: providerEventId,
    type: "payment.succeeded",
    data: { providerReference, method: "cod" },
  });
  await prisma.paymentWebhookEvent.create({
    data: {
      provider: "cod",
      providerEventId,
      paymentAttemptId: payment.id,
      eventType: "payment.succeeded",
      payloadHash: createHash("sha256").update(rawPayload).digest("hex"),
      signatureValid: true,
      rawPayload: JSON.parse(rawPayload),
      processed: false,
    },
  });

  await markPaymentSucceeded(
    payment.id,
    providerEventId,
    "cod",
    correlationId,
  );
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
    include: { lines: true },
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
      // Payment failure released reservations — re-hold stock before a new attempt.
      for (const line of order.lines) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { variantId: line.variantId },
        });
        if (!inventory) {
          throw new OrderConflictError(
            `Cannot re-reserve stock for ${line.sku}: inventory missing`,
          );
        }
        const available = availableQuantity(inventory.onHand, inventory.reserved);
        if (available < line.quantity) {
          throw new OrderConflictError(
            `Cannot re-reserve stock for ${line.sku}: only ${available} available`,
          );
        }
        await tx.inventoryItem.update({
          where: { id: inventory.id, version: inventory.version },
          data: {
            reserved: { increment: line.quantity },
            version: { increment: 1 },
          },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventory.id,
            movementType: "reserve",
            quantity: line.quantity,
            reason: `Payment retry reserve ${order.orderNumber}`,
            actorId: actor.userId,
            correlationId,
          },
        });
      }

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
        reason: `Payment attempt created (${created.provider})`,
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
          provider: attempt.provider,
        },
      },
    });
    return attempt;
  });

  const body = {
    payment: {
      id: payment.id,
      status: payment.status,
      provider: payment.provider,
      providerReference: payment.providerReference,
      clientSecret: payment.clientSecret,
      amountPaise: payment.amountPaise,
      /** Razorpay Checkout.js key id (also mirrored on clientSecret for razorpay). */
      publicKey: created.publicKey ?? null,
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
  const payload: PaymentWebhookPayload = {
    id: `evt_${crypto.randomUUID()}`,
    type: input.outcome === "succeeded" ? "payment.succeeded" : "payment.failed",
    createdAt: new Date().toISOString(),
    data: {
      providerReference: payment.providerReference,
      amountPaise: payment.amountPaise,
      currencyCode: payment.currencyCode,
      failureReason:
        input.outcome === "failed"
          ? (input.failureReason ?? "Payment declined")
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
  const provider = getPaymentProvider();
  const signatureValid = provider.verifyWebhookSignature(
    input.rawBody,
    input.signatureHeader,
  );
  if (!signatureValid) {
    throw new WebhookRejectedError("Invalid webhook signature");
  }

  let payload: PaymentWebhookPayload;
  try {
    payload = provider.parseWebhook(input.rawBody);
  } catch {
    throw new WebhookRejectedError("Malformed webhook payload");
  }

  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");
  const providerName = provider.name;

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: providerName,
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
  if (payment.provider !== providerName) {
    throw new WebhookRejectedError("Webhook provider does not match payment");
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
          provider: providerName,
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
            provider: providerName,
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
    await markPaymentSucceeded(
      payment.id,
      payload.id,
      providerName,
      input.correlationId,
    );
  } else {
    await markPaymentFailed(
      payment.id,
      payload.id,
      providerName,
      payload.data.failureReason ?? "Payment failed",
      input.correlationId,
    );
  }

  const event = await prisma.paymentWebhookEvent.findUniqueOrThrow({
    where: {
      provider_providerEventId: {
        provider: providerName,
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
  providerName: string,
  correlationId: string,
) {
  const payment = await prisma.paymentAttempt.findUniqueOrThrow({
    where: { id: paymentAttemptId },
    include: {
      order: {
        include: {
          lines: true,
          user: { include: { buyerProfile: true } },
          address: true,
          groups: {
            include: {
              seller: true,
              lines: true,
            },
          },
        },
      },
    },
  });

  if (payment.status === "succeeded") {
    await prisma.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: providerName,
          providerEventId,
        },
      },
      data: { processed: true, processedAt: new Date() },
    });
    return;
  }

  assertPaymentTransition(payment.status, "succeeded");
  assertOrderTransition(payment.order.status, "paid");

  await ensureChartOfAccounts();

  await prisma.$transaction(async (tx) => {
    const paidAt = new Date();
    await tx.paymentAttempt.update({
      where: { id: payment.id, version: payment.version },
      data: {
        status: "succeeded",
        paidAt,
        version: { increment: 1 },
      },
    });
    await tx.order.update({
      where: { id: payment.orderId, version: payment.order.version },
      data: {
        status: "paid",
        paidAt,
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

    const sellerSlices = payment.order.groups.map((group) => {
      const taxablePaise = group.lines.reduce(
        (sum, line) => sum + line.lineTotalPaise,
        0,
      );
      return {
        sellerId: group.sellerId,
        legalName: group.seller.legalName,
        tradeName: group.seller.tradeName,
        gstin: group.seller.gstin,
        registeredState: group.seller.registeredState,
        pickupCity: group.seller.pickupCity,
        fulfilmentBy: group.seller.fulfilmentBy,
        taxablePaise,
        lines: group.lines.map((line) => ({
          sku: line.sku,
          title: `${line.productTitle} / ${line.variantTitle}`,
          quantity: line.quantity,
          unitPricePaise: line.unitPricePaise,
          lineTotalPaise: line.lineTotalPaise,
        })),
      };
    });

    const document = buildEcoInvoiceDocument({
      invoiceNumber: invoiceNumber(payment.order.orderNumber),
      orderNumber: payment.order.orderNumber,
      orderId: payment.orderId,
      buyer: {
        userId: payment.order.userId,
        email: payment.order.user.email,
        name: payment.order.user.displayName,
        gstin: payment.order.user.buyerProfile?.gstin ?? null,
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
      sellers: sellerSlices,
      totals: {
        subtotalPaise: payment.order.subtotalPaise,
        discountPaise: payment.order.discountPaise,
        shippingPaise: payment.order.shippingPaise,
        taxPaise: payment.order.taxPaise,
        totalPaise: payment.order.totalPaise,
      },
      collectionMode: payment.provider === "cod" ? "cod" : "prepaid",
    });

    const periodMonth = `${paidAt.getUTCFullYear()}-${String(
      paidAt.getUTCMonth() + 1,
    ).padStart(2, "0")}`;

    for (const slice of sellerSlices) {
      if (!slice.gstin) continue;
      const tcs = computeTcsSection52({
        taxablePaise: slice.taxablePaise,
        originState: slice.registeredState ?? "Maharashtra",
        destinationState: payment.order.address.state,
      });
      await tx.tcsCollectionLine.upsert({
        where: {
          orderId_sellerId: {
            orderId: payment.orderId,
            sellerId: slice.sellerId,
          },
        },
        create: {
          orderId: payment.orderId,
          sellerId: slice.sellerId,
          sellerGstin: slice.gstin,
          supplyType: tcs.supplyType,
          taxablePaise: tcs.taxablePaise,
          cgstPaise: tcs.cgstPaise,
          sgstPaise: tcs.sgstPaise,
          igstPaise: tcs.igstPaise,
          tcsPaise: tcs.tcsPaise,
          tcsGstin: tcs.tcsGstin,
          periodMonth,
        },
        update: {
          taxablePaise: tcs.taxablePaise,
          cgstPaise: tcs.cgstPaise,
          sgstPaise: tcs.sgstPaise,
          igstPaise: tcs.igstPaise,
          tcsPaise: tcs.tcsPaise,
          supplyType: tcs.supplyType,
          tcsGstin: tcs.tcsGstin,
          periodMonth,
        },
      });
    }

    // Vercel functions are read-only except /tmp — use shared storage root.
    const storage = createDocumentStorage();
    const htmlBytes = Buffer.from(renderInvoiceHtml(document), "utf8");
    const stored = await storage.put({
      namespace: "invoices",
      fileName: `${document.invoiceNumber}.html`,
      contentType: "text/html; charset=utf-8",
      bytes: htmlBytes,
    });

    await tx.invoice.create({
      data: {
        orderId: payment.orderId,
        invoiceNumber: document.invoiceNumber,
        status: "issued",
        totalPaise: payment.order.totalPaise,
        document,
        storageKey: stored.key,
        issuedAt: paidAt,
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
          ecoGstinTcs: asperaLegal.gstinTcs,
        },
        reason:
          providerName === "cod"
            ? "COD order confirmed — collect cash on delivery"
            : "Verified payment webhook",
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
          collectionMode: providerName === "cod" ? "cod" : "prepaid",
        },
      },
    });

    await postOrderPaidLedger(payment.orderId, correlationId, tx);

    await tx.paymentWebhookEvent.update({
      where: {
        provider_providerEventId: {
          provider: providerName,
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
    templateKey: providerName === "cod" ? "order.cod_confirmed" : "order.paid",
    payload: {
      orderNumber: payment.order.orderNumber,
      totalPaise: payment.order.totalPaise,
    },
  });
  await prisma.notificationMessage.create({
    data: {
      channel: "email",
      recipient: payment.order.user.email,
      templateKey: providerName === "cod" ? "order.cod_confirmed" : "order.paid",
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
  providerName: string,
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
          provider: providerName,
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
          provider: providerName,
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
  const orders = await prisma.order.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      invoices: true,
      lines: true,
      address: true,
      groups: {
        select: {
          id: true,
          sellerId: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
          cancelledAt: true,
          trackingNumber: true,
          trackingUrl: true,
          carrier: true,
        },
      },
      returnRequests: {
        select: { id: true, status: true, orderLineId: true },
      },
    },
  });

  const productIds = [
    ...new Set(orders.flatMap((order) => order.lines.map((line) => line.productId))),
  ];
  const products =
    productIds.length === 0
      ? []
      : await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, altText: true },
            },
          },
        });
  const productById = new Map(products.map((product) => [product.id, product]));

  return orders.map((order) => ({
    ...order,
    lines: order.lines.map((line) => {
      const product = productById.get(line.productId);
      return {
        ...line,
        productSlug: product?.slug ?? null,
        imageUrl: product?.images[0]?.url ?? null,
        imageAlt: product?.images[0]?.altText ?? null,
      };
    }),
  }));
}

export async function getOrderForActor(actor: Actor, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: actor.userId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      invoices: true,
      lines: true,
      groups: {
        include: {
          shipment: true,
          seller: {
            select: {
              id: true,
              tradeName: true,
              legalName: true,
              ratingAvg: true,
              ratingCount: true,
            },
          },
        },
      },
      address: true,
      returnRequests: true,
      refunds: true,
      protectionClaims: true,
    },
  });
  if (!order) {
    throw new OrderValidationError("Order not found");
  }
  return order;
}

/** Buyer cancel: unpaid orders, or paid orders still pending/processing (pre-ship). */
export async function cancelBuyerOrder(
  actor: Actor,
  orderId: string,
  reason: string,
  correlationId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: actor.userId },
    include: {
      groups: { include: { lines: true } },
      lines: true,
      payments: true,
    },
  });
  if (!order) {
    throw new OrderValidationError("Order not found");
  }

  if (
    order.status === "awaiting_payment" ||
    order.status === "payment_failed"
  ) {
    assertOrderTransition(order.status, "cancelled");
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id, version: order.version },
        data: {
          status: "cancelled",
          statusReason: reason,
          cancelledAt: new Date(),
          version: { increment: 1 },
        },
      });
      for (const payment of order.payments) {
        if (payment.status === "created" || payment.status === "pending") {
          assertPaymentTransition(payment.status, "cancelled");
          await tx.paymentAttempt.update({
            where: { id: payment.id },
            data: { status: "cancelled", failureReason: reason },
          });
        }
      }
      // awaiting_payment still holds checkout reservations; payment_failed
      // already released them in markPaymentFailed — release is a no-op then.
      if (order.status === "awaiting_payment") {
        for (const line of order.lines) {
          const inventory = await tx.inventoryItem.findUnique({
            where: { variantId: line.variantId },
          });
          if (!inventory) continue;
          const releaseQty = Math.min(inventory.reserved, line.quantity);
          if (releaseQty <= 0) continue;
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
              reason: `Buyer unpaid cancel ${order.orderNumber}`,
              actorId: actor.userId,
              correlationId,
            },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "order.buyer_cancelled",
          targetType: "order",
          targetId: order.id,
          beforeState: { status: order.status },
          afterState: { status: "cancelled" },
          reason,
          correlationId,
        },
      });
      await tx.outboxEvent.create({
        data: {
          eventType: "OrderCancelled",
          aggregateType: "order",
          aggregateId: order.id,
          payload: { reason, by: "buyer" },
        },
      });
      return updated;
    });
  }

  if (order.status !== "paid" && order.status !== "partially_cancelled") {
    throw new OrderValidationError(
      "This order can no longer be cancelled. Use returns for delivered items.",
    );
  }

  const cancellable = order.groups.filter(
    (group) => group.status === "pending" || group.status === "processing",
  );
  if (cancellable.length === 0) {
    throw new OrderValidationError(
      "Items are already shipped or delivered. Cancel is unavailable — request a return instead.",
    );
  }
  const blocked = order.groups.filter(
    (group) =>
      group.status === "shipped" || group.status === "delivered",
  );
  if (blocked.length > 0 && cancellable.length < order.groups.length) {
    // Partial: cancel only unshipped groups
  }

  for (const group of cancellable) {
    const commissionRateBps = await resolveCommissionRateBps(group.sellerId);
    await prisma.$transaction(async (tx) => {
      await tx.orderFulfilmentGroup.update({
        where: { id: group.id, version: group.version },
        data: {
          status: "cancelled",
          statusReason: reason,
          cancelledAt: new Date(),
          version: { increment: 1 },
        },
      });
      for (const line of group.lines) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { variantId: line.variantId },
        });
        if (!inventory) continue;
        await tx.inventoryItem.update({
          where: { id: inventory.id },
          data: {
            onHand: { increment: line.quantity },
            version: { increment: 1 },
          },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventory.id,
            movementType: "return_to_stock",
            quantity: line.quantity,
            reason: `Buyer cancel ${order.orderNumber}: ${reason}`,
            actorId: actor.userId,
            correlationId,
          },
        });
      }
      for (const line of group.lines) {
        await createCappedLineRefund({
          tx,
          order,
          sellerId: group.sellerId,
          line,
          reason,
          correlationId,
          commissionRateBps,
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "fulfilment.buyer_cancelled",
          targetType: "fulfilment_group",
          targetId: group.id,
          afterState: { status: "cancelled", reason },
          reason,
          correlationId,
        },
      });
      await tx.outboxEvent.create({
        data: {
          eventType: "FulfilmentCancelled",
          aggregateType: "fulfilment_group",
          aggregateId: group.id,
          payload: { orderId: group.orderId, reason, by: "buyer" },
        },
      });
    });
  }

  // Sync order status from groups
  const fresh = await prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { groups: true },
  });
  const statuses = fresh.groups.map((g) => g.status);
  let next = fresh.status;
  if (statuses.every((s) => s === "cancelled")) {
    next = "cancelled";
  } else if (statuses.some((s) => s === "cancelled")) {
    next = "partially_cancelled";
  }
  if (next !== fresh.status) {
    assertOrderTransition(fresh.status, next);
    return prisma.order.update({
      where: { id: fresh.id, version: fresh.version },
      data: {
        status: next,
        statusReason: reason,
        cancelledAt: next === "cancelled" ? new Date() : fresh.cancelledAt,
        version: { increment: 1 },
      },
    });
  }
  return fresh;
}

export async function getInvoiceForActor(
  actor: Actor,
  orderId: string,
  invoiceId: string,
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      orderId,
      order: { userId: actor.userId },
    },
  });
  if (!invoice) {
    throw new OrderValidationError("Invoice not found");
  }
  return invoice;
}

/** Printable ECO invoice HTML (seller = supplier, Aspera = ECO, TCS line). */
export async function getInvoiceHtmlForActor(
  actor: Actor,
  orderId: string,
  invoiceId: string,
) {
  const invoice = await getInvoiceForActor(actor, orderId, invoiceId);
  if (invoice.storageKey) {
    try {
      const storage = createDocumentStorage();
      const bytes = await storage.get(invoice.storageKey);
      return {
        invoiceNumber: invoice.invoiceNumber,
        html: bytes.toString("utf8"),
      };
    } catch {
      // Fall through to document JSON render when /tmp storage was wiped.
    }
  }
  const document = invoice.document as Parameters<
    typeof renderInvoiceHtml
  >[0] | null;
  if (!document || typeof document !== "object") {
    throw new OrderValidationError("Invoice document missing");
  }
  return {
    invoiceNumber: invoice.invoiceNumber,
    html: renderInvoiceHtml(document),
  };
}
