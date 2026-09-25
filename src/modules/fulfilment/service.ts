import { randomBytes } from "node:crypto";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  actorOwnsSeller,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";
import { assertFulfilmentTransition } from "@/modules/fulfilment/states";
import { assertOrderTransition } from "@/modules/orders/states";
import type {
  CancelGroupInput,
  CreateDisputeInput,
  CreateReturnInput,
  CreateTicketInput,
  MarkDeliveredInput,
  ReviewReturnInput,
  ShipGroupInput,
  StartProcessingInput,
} from "@/modules/fulfilment/schema";
import { getNotificationPort } from "@/platform/notifications/port";

export class FulfilmentValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "FulfilmentValidationError";
  }
}

function requireSellerOrAdmin(actor: Actor, sellerId: string) {
  if (!actorOwnsSeller(actor, sellerId) && !actorIsAdmin(actor)) {
    throw new AuthorizationError("Seller ownership required");
  }
}

async function refreshOrderStatus(orderId: string, correlationId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { groups: true },
  });
  if (order.status === "cancelled" || order.status === "awaiting_payment") {
    return order;
  }
  const statuses = order.groups.map((group) => group.status);
  let next: OrderStatus = order.status;
  if (statuses.every((status) => status === "cancelled")) {
    next = "cancelled";
  } else if (statuses.every((status) => status === "delivered")) {
    next = "fulfilled";
  } else if (statuses.some((status) => status === "cancelled")) {
    next = "partially_cancelled";
  } else if (order.status === "paid" || order.status === "partially_cancelled") {
    next = order.status;
  }

  if (next !== order.status) {
    assertOrderTransition(order.status, next);
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id, version: order.version },
        data: {
          status: next,
          cancelledAt: next === "cancelled" ? new Date() : order.cancelledAt,
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: null,
          action: "order.status_synced",
          targetType: "order",
          targetId: order.id,
          beforeState: { status: order.status },
          afterState: { status: next },
          reason: "Derived from fulfilment group states",
          correlationId,
        },
      });
      return updated;
    });
  }
  return order;
}

export async function listSellerFulfilment(actor: Actor, sellerId: string) {
  requireSellerOrAdmin(actor, sellerId);
  return prisma.orderFulfilmentGroup.findMany({
    where: {
      sellerId,
      order: { status: { in: ["paid", "partially_cancelled", "fulfilled"] } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
      lines: true,
      shipment: true,
    },
  });
}

export async function startProcessing(
  actor: Actor,
  input: StartProcessingInput,
  correlationId: string,
) {
  const group = await prisma.orderFulfilmentGroup.findUniqueOrThrow({
    where: { id: input.fulfilmentGroupId },
    include: { order: true },
  });
  requireSellerOrAdmin(actor, group.sellerId);
  if (group.order.status !== "paid" && group.order.status !== "partially_cancelled") {
    throw new FulfilmentValidationError("Order must be paid before processing");
  }
  assertFulfilmentTransition(group.status, "processing");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.orderFulfilmentGroup.update({
      where: { id: group.id, version: group.version },
      data: {
        status: "processing",
        statusReason: input.reason,
        version: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "fulfilment.processing",
        targetType: "fulfilment_group",
        targetId: group.id,
        beforeState: { status: group.status },
        afterState: { status: updated.status },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "FulfilmentProcessing",
        aggregateType: "fulfilment_group",
        aggregateId: group.id,
        payload: { orderId: group.orderId, sellerId: group.sellerId },
      },
    });
    return updated;
  });
}

export async function shipGroup(
  actor: Actor,
  input: ShipGroupInput,
  correlationId: string,
) {
  const group = await prisma.orderFulfilmentGroup.findUniqueOrThrow({
    where: { id: input.fulfilmentGroupId },
    include: { order: { include: { user: true } } },
  });
  requireSellerOrAdmin(actor, group.sellerId);
  assertFulfilmentTransition(group.status, "shipped");

  const trackingNumber =
    input.trackingNumber ??
    `MOCK${randomBytes(5).toString("hex").toUpperCase()}`;
  const trackingUrl = `https://tracking.mock.local/${trackingNumber}`;

  const updated = await prisma.$transaction(async (tx) => {
    const fulfilment = await tx.orderFulfilmentGroup.update({
      where: { id: group.id, version: group.version },
      data: {
        status: "shipped",
        carrier: input.carrier,
        trackingNumber,
        trackingUrl,
        shippedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.shipment.create({
      data: {
        fulfilmentGroupId: group.id,
        carrier: input.carrier,
        trackingNumber,
        trackingUrl,
        status: "in_transit",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "fulfilment.shipped",
        targetType: "fulfilment_group",
        targetId: group.id,
        afterState: { trackingNumber, carrier: input.carrier },
        reason: "Mock shipment created",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ShipmentCreated",
        aggregateType: "fulfilment_group",
        aggregateId: group.id,
        payload: { trackingNumber, carrier: input.carrier },
      },
    });
    return fulfilment;
  });

  const notifier = getNotificationPort();
  await notifier.send({
    channel: "email",
    recipient: group.order.user.email,
    templateKey: "shipment.created",
    payload: {
      orderId: group.orderId,
      trackingNumber,
      carrier: input.carrier,
    },
  });

  return updated;
}

export async function markDelivered(
  actor: Actor,
  input: MarkDeliveredInput,
  correlationId: string,
) {
  const group = await prisma.orderFulfilmentGroup.findUniqueOrThrow({
    where: { id: input.fulfilmentGroupId },
  });
  requireSellerOrAdmin(actor, group.sellerId);
  assertFulfilmentTransition(group.status, "delivered");

  const updated = await prisma.$transaction(async (tx) => {
    const fulfilment = await tx.orderFulfilmentGroup.update({
      where: { id: group.id, version: group.version },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.shipment.updateMany({
      where: { fulfilmentGroupId: group.id },
      data: { status: "delivered" },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "fulfilment.delivered",
        targetType: "fulfilment_group",
        targetId: group.id,
        afterState: { status: "delivered" },
        reason: "Mock delivery confirmed",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ShipmentDelivered",
        aggregateType: "fulfilment_group",
        aggregateId: group.id,
        payload: { orderId: group.orderId },
      },
    });
    return fulfilment;
  });

  await refreshOrderStatus(group.orderId, correlationId);
  return updated;
}

export async function cancelFulfilmentGroup(
  actor: Actor,
  input: CancelGroupInput,
  correlationId: string,
) {
  const group = await prisma.orderFulfilmentGroup.findUniqueOrThrow({
    where: { id: input.fulfilmentGroupId },
    include: { lines: true, order: true },
  });
  requireSellerOrAdmin(actor, group.sellerId);
  assertFulfilmentTransition(group.status, "cancelled");

  const updated = await prisma.$transaction(async (tx) => {
    const fulfilment = await tx.orderFulfilmentGroup.update({
      where: { id: group.id, version: group.version },
      data: {
        status: "cancelled",
        statusReason: input.reason,
        cancelledAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Restock cancelled undelivered units.
    if (group.status !== "delivered") {
      for (const line of group.lines) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { variantId: line.variantId },
        });
        if (!inventory) {
          continue;
        }
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
            reason: `Partial cancel ${group.order.orderNumber}: ${input.reason}`,
            actorId: actor.userId,
            correlationId,
          },
        });
      }
    }

    await tx.refund.create({
      data: {
        orderId: group.orderId,
        amountPaise: group.lineTotalPaise,
        status: "succeeded",
        provider: "mock",
        providerReference: `mock_ref_${randomBytes(8).toString("hex")}`,
        reason: input.reason,
        completedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "fulfilment.cancelled",
        targetType: "fulfilment_group",
        targetId: group.id,
        afterState: { status: "cancelled", reason: input.reason },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "FulfilmentCancelled",
        aggregateType: "fulfilment_group",
        aggregateId: group.id,
        payload: { orderId: group.orderId, reason: input.reason },
      },
    });
    return fulfilment;
  });

  await refreshOrderStatus(group.orderId, correlationId);
  return updated;
}

export async function createReturnRequest(
  actor: Actor,
  input: CreateReturnInput,
  correlationId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: actor.userId },
    include: { groups: true, lines: true },
  });
  if (!order) {
    throw new FulfilmentValidationError("Order not found");
  }
  const delivered = order.groups.some(
    (group) =>
      group.sellerId === input.sellerId && group.status === "delivered",
  );
  if (!delivered) {
    throw new FulfilmentValidationError(
      "Returns require a delivered fulfilment group for that seller",
    );
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.returnRequest.create({
      data: {
        orderId: order.id,
        userId: actor.userId,
        sellerId: input.sellerId,
        orderLineId: input.orderLineId,
        quantity: input.quantity,
        reason: input.reason,
        status: "requested",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "return.requested",
        targetType: "return_request",
        targetId: created.id,
        afterState: { reason: input.reason, quantity: input.quantity },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ReturnRequested",
        aggregateType: "return_request",
        aggregateId: created.id,
        payload: { orderId: order.id, sellerId: input.sellerId },
      },
    });
    return created;
  });
}

export async function reviewReturnRequest(
  actor: Actor,
  input: ReviewReturnInput,
  correlationId: string,
) {
  const request = await prisma.returnRequest.findUniqueOrThrow({
    where: { id: input.returnRequestId },
    include: { order: { include: { lines: true } } },
  });
  requireSellerOrAdmin(actor, request.sellerId);
  if (request.status !== "requested") {
    throw new FulfilmentValidationError("Return is not awaiting review");
  }

  const nextStatus = input.decision === "approve" ? "approved" : "rejected";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.returnRequest.update({
      where: { id: request.id, version: request.version },
      data: {
        status: nextStatus,
        statusReason: input.reason,
        version: { increment: 1 },
      },
    });

    if (input.decision === "approve") {
      const line = request.orderLineId
        ? request.order.lines.find((entry) => entry.id === request.orderLineId)
        : request.order.lines.find((entry) => entry.sellerId === request.sellerId);
      const amountPaise = line
        ? Math.floor((line.lineTotalPaise / line.quantity) * request.quantity)
        : Math.floor(request.order.lines
            .filter((entry) => entry.sellerId === request.sellerId)
            .reduce((sum, entry) => sum + entry.lineTotalPaise, 0) / 2);

      await tx.refund.create({
        data: {
          orderId: request.orderId,
          returnRequestId: request.id,
          amountPaise,
          status: "succeeded",
          provider: "mock",
          providerReference: `mock_ref_${randomBytes(8).toString("hex")}`,
          reason: input.reason,
          completedAt: new Date(),
        },
      });

      if (line) {
        const inventory = await tx.inventoryItem.findUnique({
          where: { variantId: line.variantId },
        });
        if (inventory) {
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              onHand: { increment: request.quantity },
              version: { increment: 1 },
            },
          });
          await tx.stockMovement.create({
            data: {
              inventoryItemId: inventory.id,
              movementType: "customer_return",
              quantity: request.quantity,
              reason: `Return approved ${request.id}`,
              actorId: actor.userId,
              correlationId,
            },
          });
        }
      }

      await tx.returnRequest.update({
        where: { id: request.id },
        data: { status: "closed" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action:
          input.decision === "approve" ? "return.approved" : "return.rejected",
        targetType: "return_request",
        targetId: request.id,
        afterState: { status: nextStatus, reason: input.reason },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType:
          input.decision === "approve" ? "ReturnApproved" : "ReturnRejected",
        aggregateType: "return_request",
        aggregateId: request.id,
        payload: { decision: input.decision },
      },
    });
    return updated;
  });
}

export async function createSupportTicket(
  actor: Actor,
  input: CreateTicketInput,
  correlationId: string,
) {
  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, userId: actor.userId },
    });
    if (!order && !actorIsAdmin(actor)) {
      throw new FulfilmentValidationError("Order not found for ticket");
    }
  }

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: actor.userId,
        orderId: input.orderId,
        subject: input.subject,
        body: input.body,
        priority: input.priority,
        status: "open",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "ticket.created",
        targetType: "support_ticket",
        targetId: ticket.id,
        afterState: { subject: ticket.subject },
        reason: "Customer opened support ticket",
        correlationId,
      },
    });
    return ticket;
  });
}

export async function createDispute(
  actor: Actor,
  input: CreateDisputeInput,
  correlationId: string,
) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: actor.userId },
  });
  if (!order) {
    throw new FulfilmentValidationError("Order not found");
  }

  return prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.create({
      data: {
        orderId: order.id,
        userId: actor.userId,
        sellerId: input.sellerId,
        reason: input.reason,
        status: "opened",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "dispute.opened",
        targetType: "dispute",
        targetId: dispute.id,
        afterState: { reason: input.reason },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "DisputeOpened",
        aggregateType: "dispute",
        aggregateId: dispute.id,
        payload: { orderId: order.id, sellerId: input.sellerId },
      },
    });
    return dispute;
  });
}

export async function listReturnsForSeller(actor: Actor, sellerId: string) {
  requireSellerOrAdmin(actor, sellerId);
  return prisma.returnRequest.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    include: { refund: true, order: { select: { orderNumber: true } } },
  });
}

export async function listTicketsForActor(actor: Actor) {
  if (actorIsAdmin(actor)) {
    return prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" } });
  }
  return prisma.supportTicket.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
  });
}
