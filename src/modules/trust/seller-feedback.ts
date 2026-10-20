import { prisma } from "@/platform/db/prisma";
import type { Actor } from "@/modules/identity/policy";
import { z } from "zod";
import { dbUuid } from "@/platform/validation/id";

export const createSellerFeedbackSchema = z.object({
  orderLineId: dbUuid,
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().max(1000).optional(),
  shippingRating: z.number().int().min(1).max(5).optional(),
  packagingRating: z.number().int().min(1).max(5).optional(),
  accuracyRating: z.number().int().min(1).max(5).optional(),
});

export type CreateSellerFeedbackInput = z.infer<
  typeof createSellerFeedbackSchema
>;

export class SellerFeedbackValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "SellerFeedbackValidationError";
  }
}

export async function createSellerFeedback(
  actor: Actor,
  input: CreateSellerFeedbackInput,
  correlationId: string,
) {
  const line = await prisma.orderLine.findUnique({
    where: { id: input.orderLineId },
    include: {
      order: {
        include: {
          groups: true,
        },
      },
    },
  });
  if (!line || line.order.userId !== actor.userId) {
    throw new SellerFeedbackValidationError("Order item not found");
  }

  const group = line.order.groups.find(
    (entry) => entry.sellerId === line.sellerId,
  );
  if (!group || group.status !== "delivered") {
    throw new SellerFeedbackValidationError(
      "You can rate a seller only after the item is delivered",
    );
  }

  const existing = await prisma.sellerFeedback.findUnique({
    where: { orderLineId: line.id },
  });
  if (existing) {
    throw new SellerFeedbackValidationError(
      "You already rated this seller for this item",
    );
  }

  return prisma.$transaction(async (tx) => {
    const feedback = await tx.sellerFeedback.create({
      data: {
        userId: actor.userId,
        sellerId: line.sellerId,
        orderLineId: line.id,
        rating: input.rating,
        text: input.text,
        shippingRating: input.shippingRating,
        packagingRating: input.packagingRating,
        accuracyRating: input.accuracyRating,
      },
    });

    const agg = await tx.sellerFeedback.aggregate({
      where: { sellerId: line.sellerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.seller.update({
      where: { id: line.sellerId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "seller_feedback.created",
        targetType: "seller_feedback",
        targetId: feedback.id,
        afterState: { rating: input.rating, sellerId: line.sellerId },
        reason: input.text?.slice(0, 200),
        correlationId,
      },
    });

    return feedback;
  });
}

export async function listSellerFeedback(sellerId: string, take = 20) {
  return prisma.sellerFeedback.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      text: true,
      shippingRating: true,
      packagingRating: true,
      accuracyRating: true,
      createdAt: true,
    },
  });
}
