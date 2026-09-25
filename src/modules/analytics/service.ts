import { prisma } from "@/platform/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  actorIsAdmin,
  AuthorizationError,
  requireSellerCapability,
  type Actor,
} from "@/modules/identity/policy";
import type {
  CreateExperimentInput,
  TrackEventInput,
  UpdateExperimentInput,
} from "@/modules/analytics/schema";

export class AnalyticsValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsValidationError";
  }
}

export async function trackAnalyticsEvent(
  actor: Actor | null,
  input: TrackEventInput,
) {
  return prisma.analyticsEvent.create({
    data: {
      eventName: input.eventName,
      actorId: actor?.userId,
      sessionId: actor?.sessionId,
      productId: input.productId,
      orderId: input.orderId,
      sellerId: input.sellerId,
      searchQuery: input.searchQuery,
      properties: (input.properties ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  });
}

export async function platformDashboard(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [eventCounts, searchTop, orders, sellers, products] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["eventName"],
      where: { createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { eventName: "desc" } },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["searchQuery"],
      where: {
        createdAt: { gte: since },
        eventName: "search",
        searchQuery: { not: null },
      },
      _count: true,
      orderBy: { _count: { searchQuery: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      _sum: { totalPaise: true },
    }),
    prisma.seller.count({ where: { status: "approved" } }),
    prisma.product.count({ where: { status: "approved" } }),
  ]);

  return {
    windowDays: 7,
    eventCounts: eventCounts.map((row) => ({
      eventName: row.eventName,
      count: row._count,
    })),
    topSearches: searchTop
      .filter((row) => row.searchQuery)
      .map((row) => ({ query: row.searchQuery!, count: row._count })),
    ordersByStatus: orders.map((row) => ({
      status: row.status,
      count: row._count,
      totalPaise: row._sum.totalPaise ?? 0,
    })),
    approvedSellers: sellers,
    approvedProducts: products,
  };
}

export async function sellerHealth(actor: Actor, sellerId: string) {
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (
    !(seller?.ownerUserId === actor.userId || actorIsAdmin(actor))
  ) {
    requireSellerCapability(actor, sellerId, "analytics.read");
  }
  const [groups, products, returns, payouts] = await Promise.all([
    prisma.orderFulfilmentGroup.groupBy({
      by: ["status"],
      where: { sellerId },
      _count: true,
      _sum: { lineTotalPaise: true },
    }),
    prisma.product.count({ where: { sellerId, status: "approved" } }),
    prisma.returnRequest.count({
      where: { sellerId, status: { in: ["requested", "approved"] } },
    }),
    prisma.settlementBatch.aggregate({
      where: { sellerId, status: { in: ["released", "paid"] } },
      _sum: { netPaise: true },
      _count: true,
    }),
  ]);
  return {
    sellerId,
    fulfilmentByStatus: groups.map((row) => ({
      status: row.status,
      count: row._count,
      lineTotalPaise: row._sum.lineTotalPaise ?? 0,
    })),
    approvedProducts: products,
    openReturns: returns,
    settledBatches: payouts._count,
    settledNetPaise: payouts._sum.netPaise ?? 0,
  };
}

export async function createExperiment(
  actor: Actor,
  input: CreateExperimentInput,
  correlationId: string,
) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  const weightSum = input.variants.reduce((sum, v) => sum + v.weight, 0);
  if (weightSum !== 100) {
    throw new AnalyticsValidationError("Variant weights must sum to 100");
  }
  return prisma.$transaction(async (tx) => {
    const created = await tx.experiment.create({
      data: {
        key: input.key,
        name: input.name,
        hypothesis: input.hypothesis,
        variants: input.variants,
        status: "draft",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "experiment.created",
        targetType: "experiment",
        targetId: created.id,
        afterState: { key: input.key },
        reason: input.hypothesis.slice(0, 200),
        correlationId,
      },
    });
    return created;
  });
}

export async function updateExperiment(
  actor: Actor,
  input: UpdateExperimentInput,
  correlationId: string,
) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  const existing = await prisma.experiment.findUniqueOrThrow({
    where: { id: input.experimentId },
  });
  return prisma.$transaction(async (tx) => {
    const updated = await tx.experiment.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        startedAt:
          input.status === "running" && !existing.startedAt
            ? new Date()
            : existing.startedAt,
        endedAt: input.status === "concluded" ? new Date() : existing.endedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "experiment.updated",
        targetType: "experiment",
        targetId: existing.id,
        afterState: { status: input.status },
        reason: `Experiment moved to ${input.status}`,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listExperiments(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
  return prisma.experiment.findMany({ orderBy: { createdAt: "desc" } });
}
