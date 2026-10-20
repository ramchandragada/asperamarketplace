import type { ProtectionClaimStatus } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";
import type {
  CreateProtectionClaimInput,
  DecideProtectionClaimInput,
} from "@/modules/protection/schema";

const MAX_OPEN_CLAIMS_PER_BUYER = 5;
const DELIVERY_SLA_DAYS = 10;
const RETURN_SELLER_SLA_DAYS = 7;

export class ProtectionValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "ProtectionValidationError";
  }
}

function requireAdmin(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

function daysSince(date: Date | null | undefined) {
  if (!date) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export async function createProtectionClaim(
  actor: Actor,
  input: CreateProtectionClaimInput,
  correlationId: string,
) {
  const openCount = await prisma.protectionClaim.count({
    where: {
      userId: actor.userId,
      status: { in: ["submitted", "under_review"] },
    },
  });
  if (openCount >= MAX_OPEN_CLAIMS_PER_BUYER) {
    throw new ProtectionValidationError(
      `You already have ${openCount} open Buyer Protection claims. Wait for a decision before filing another.`,
    );
  }

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: actor.userId },
    include: {
      lines: true,
      groups: true,
      returnRequests: true,
      protectionClaims: {
        where: { orderLineId: input.orderLineId },
      },
    },
  });
  if (!order) {
    throw new ProtectionValidationError("Order not found");
  }

  const line = order.lines.find((entry) => entry.id === input.orderLineId);
  if (!line) {
    throw new ProtectionValidationError("Order item not found on this order");
  }

  if (order.protectionClaims.length > 0) {
    throw new ProtectionValidationError(
      "A Buyer Protection claim already exists for this item",
    );
  }

  const group = order.groups.find((entry) => entry.sellerId === line.sellerId);
  if (!group) {
    throw new ProtectionValidationError("Fulfilment group not found");
  }

  const eligible = isClaimEligible({
    claimType: input.claimType,
    groupStatus: group.status,
    paidAt: order.paidAt,
    shippedAt: group.shippedAt,
    deliveredAt: group.deliveredAt,
    returnRequests: order.returnRequests.filter(
      (entry) => entry.orderLineId === line.id || entry.sellerId === line.sellerId,
    ),
  });
  if (!eligible.ok) {
    throw new ProtectionValidationError(eligible.reason);
  }

  return prisma.$transaction(async (tx) => {
    const claim = await tx.protectionClaim.create({
      data: {
        orderId: order.id,
        orderLineId: line.id,
        userId: actor.userId,
        sellerId: line.sellerId,
        claimType: input.claimType,
        description: input.description,
        evidenceUrls: input.evidenceUrls ?? [],
        status: "submitted",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "protection_claim.submitted",
        targetType: "protection_claim",
        targetId: claim.id,
        afterState: {
          claimType: input.claimType,
          orderLineId: line.id,
        },
        reason: input.description.slice(0, 200),
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ProtectionClaimSubmitted",
        aggregateType: "protection_claim",
        aggregateId: claim.id,
        payload: {
          orderId: order.id,
          sellerId: line.sellerId,
          claimType: input.claimType,
        },
      },
    });
    return claim;
  });
}

function isClaimEligible(input: {
  claimType: CreateProtectionClaimInput["claimType"];
  groupStatus: string;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  returnRequests: Array<{ status: string; createdAt: Date; updatedAt: Date }>;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.paidAt) {
    return { ok: false, reason: "Claims are only available on paid orders" };
  }

  if (input.claimType === "not_delivered") {
    if (input.deliveredAt) {
      return { ok: false, reason: "This shipment is already marked delivered" };
    }
    const sincePaid = daysSince(input.paidAt) ?? 0;
    if (sincePaid < DELIVERY_SLA_DAYS && input.groupStatus !== "cancelled") {
      return {
        ok: false,
        reason: `Delivery SLA has not elapsed yet (claim after ${DELIVERY_SLA_DAYS} days if still undelivered)`,
      };
    }
    return { ok: true };
  }

  if (input.claimType === "return_not_honored") {
    const openOrStale = input.returnRequests.find((entry) => {
      const age = daysSince(entry.createdAt) ?? 0;
      return (
        (entry.status === "requested" || entry.status === "approved") &&
        age >= RETURN_SELLER_SLA_DAYS
      );
    });
    if (!openOrStale) {
      return {
        ok: false,
        reason: `File a return first; claims open after ${RETURN_SELLER_SLA_DAYS} days without seller action`,
      };
    }
    return { ok: true };
  }

  // not_as_described / other — require delivered
  if (input.groupStatus !== "delivered" && !input.deliveredAt) {
    return {
      ok: false,
      reason: "Item must be delivered before filing this claim type",
    };
  }
  return { ok: true };
}

export async function getProtectionClaimForActor(
  actor: Actor,
  claimId: string,
) {
  const claim = await prisma.protectionClaim.findUnique({
    where: { id: claimId },
    include: {
      order: { select: { orderNumber: true, status: true } },
      seller: { select: { tradeName: true, legalName: true } },
    },
  });
  if (!claim) {
    throw new ProtectionValidationError("Claim not found");
  }
  if (claim.userId !== actor.userId && !actorIsAdmin(actor)) {
    throw new AuthorizationError("Not allowed to view this claim");
  }
  return claim;
}

export async function listProtectionClaimsForActor(actor: Actor) {
  return prisma.protectionClaim.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true } },
      seller: { select: { tradeName: true, legalName: true } },
    },
  });
}

export async function listProtectionClaimsForAdmin(actor: Actor) {
  requireAdmin(actor);
  return prisma.protectionClaim.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: { select: { orderNumber: true, status: true } },
      seller: { select: { tradeName: true, legalName: true } },
      user: { select: { email: true, displayName: true } },
    },
  });
}

export async function decideProtectionClaim(
  actor: Actor,
  input: DecideProtectionClaimInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const claim = await prisma.protectionClaim.findUnique({
    where: { id: input.claimId },
    include: {
      order: { include: { lines: true } },
    },
  });
  if (!claim) {
    throw new ProtectionValidationError("Claim not found");
  }
  if (["approved", "rejected", "seller_resolved"].includes(claim.status)) {
    throw new ProtectionValidationError("Claim already decided");
  }

  const nextStatus = input.decision as ProtectionClaimStatus;
  const line = claim.order.lines.find((entry) => entry.id === claim.orderLineId);
  const refundAmount = line?.lineTotalPaise ?? 0;

  return prisma.$transaction(async (tx) => {
    let refundId: string | null = claim.refundId;
    let sellerDebitPaise: number | null = claim.sellerDebitPaise;

    if (input.decision === "approved" && refundAmount > 0) {
      const refund = await tx.refund.create({
        data: {
          orderId: claim.orderId,
          amountPaise: refundAmount,
          status: "pending",
          provider: "mock",
          reason: `Buyer Protection approved: ${input.resolutionNote.slice(0, 180)}`,
        },
      });
      refundId = refund.id;
      sellerDebitPaise = refundAmount;
      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "succeeded",
          completedAt: new Date(),
          providerReference: `protection:${claim.id}`,
        },
      });
    }

    const updated = await tx.protectionClaim.update({
      where: { id: claim.id },
      data: {
        status: nextStatus,
        resolutionNote: input.resolutionNote,
        refundId,
        sellerDebitPaise,
        decidedAt: ["approved", "rejected", "seller_resolved"].includes(
          input.decision,
        )
          ? new Date()
          : null,
        decidedByUserId: actor.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "protection_claim.decided",
        targetType: "protection_claim",
        targetId: claim.id,
        afterState: {
          status: nextStatus,
          refundId,
          sellerDebitPaise,
        },
        reason: input.resolutionNote.slice(0, 200),
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "ProtectionClaimDecided",
        aggregateType: "protection_claim",
        aggregateId: claim.id,
        payload: { status: nextStatus, refundId, sellerDebitPaise },
      },
    });
    return updated;
  });
}
