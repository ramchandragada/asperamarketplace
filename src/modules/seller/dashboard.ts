import { prisma } from "@/platform/db/prisma";
import {
  actorHasSellerCapability,
  requireSellerCapability,
  type Actor,
  type SellerCapability,
} from "@/modules/identity/policy";
import { formatPaise } from "@/modules/catalogue/helpers";

const LATE_FULFILMENT_HOURS = 24;
const LOW_STOCK_AVAILABLE = 5;
const SHIP_SLA_HOURS = 24;

export type ActionPriority = "critical" | "action" | "info" | "completed";

export type SellerActionDashboard = {
  sellerId: string;
  tradeName: string | null;
  legalName: string;
  kycStatus: string;
  gstinMasked: string | null;
  taxProfileActive: boolean;
  lateFulfilment: Array<{
    id: string;
    orderNumber: string;
    status: string;
    ageHours: number;
    lineTotalPaise: number;
  }>;
  awaitingFulfilment: Array<{
    id: string;
    orderNumber: string;
    status: string;
    lineTotalPaise: number;
    ageHours: number;
    createdAt: string;
    shipByAt: string;
    itemCount: number;
    city: string;
    postalCode: string;
    firstTitle: string;
  }>;
  outOfStock: Array<{
    inventoryItemId: string;
    sku: string;
    productTitle: string;
    available: number;
    onHand: number;
    reserved: number;
  }>;
  lowStock: Array<{
    inventoryItemId: string;
    sku: string;
    productTitle: string;
    available: number;
    onHand: number;
    reserved: number;
  }>;
  draftProducts: Array<{ id: string; title: string; status: string }>;
  openReturns: Array<{
    id: string;
    orderNumber: string;
    status: string;
    reason: string;
    createdAt: string;
  }>;
  nextSettlement: {
    id: string;
    batchNumber: string;
    status: string;
    netPaise: number;
    netFormatted: string;
    periodEnd: string;
  } | null;
  recentSalesPaise: number;
  catalogue: {
    live: number;
    submitted: number;
    draft: number;
    rejected: number;
    totalSkus: number;
    inStockSkus: number;
  };
  metrics: {
    sales30dPaise: number;
    salesTrendPct: number | null;
    orders30d: number;
    ordersTrendPct: number | null;
    payoutDuePaise: number;
    sales7dPaise: number;
    units30d: number;
    shippedToday: number;
    deliveredToday: number;
    cancelled30d: number;
    dailySales: Array<{ label: string; paise: number }>;
  };
  accountHealth: {
    rating: "healthy" | "at_risk" | "critical";
    lateShipmentRatePct: number;
    cancellationRatePct: number;
    returnRatePct: number;
    oosSkuRatePct: number;
    targets: {
      lateShipmentMaxPct: number;
      cancellationMaxPct: number;
      returnMaxPct: number;
      oosSkuMaxPct: number;
    };
  };
  topProducts: Array<{
    productId: string;
    title: string;
    units: number;
    salesPaise: number;
  }>;
  alerts: Array<{
    id: string;
    priority: ActionPriority;
    title: string;
    detail: string;
    href: string;
  }>;
  capabilities: {
    catalogue: boolean;
    fulfilment: boolean;
    returns: boolean;
    finance: boolean;
  };
};

function ratePct(num: number, den: number) {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

export async function getSellerActionDashboard(
  actor: Actor,
  sellerId: string,
): Promise<SellerActionDashboard> {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: sellerId },
  });
  if (seller.ownerUserId !== actor.userId) {
    requireSellerCapability(actor, sellerId, "dashboard.read");
  }

  const lateCutoff = new Date(
    Date.now() - LATE_FULFILMENT_HOURS * 60 * 60 * 1000,
  );
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    lateGroups,
    awaitingGroups,
    inventory,
    returns,
    settlement,
    drafts,
    taxProfile,
    recentPaid,
    salesGroups,
    payoutAgg,
    liveCount,
    submittedCount,
    draftCount,
    rejectedCount,
    cancelled30d,
    delivered30d,
    shippedToday,
    deliveredToday,
    topLineAgg,
  ] = await Promise.all([
    prisma.orderFulfilmentGroup.findMany({
      where: {
        sellerId,
        status: { in: ["pending", "processing"] },
        createdAt: { lte: lateCutoff },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.orderFulfilmentGroup.findMany({
      where: {
        sellerId,
        status: { in: ["pending", "processing"] },
      },
      orderBy: { createdAt: "asc" },
      take: 25,
      include: {
        order: {
          select: {
            orderNumber: true,
            address: { select: { city: true, postalCode: true } },
          },
        },
        lines: {
          select: {
            quantity: true,
            productTitle: true,
            lineTotalPaise: true,
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        sellerId,
        variant: { isActive: true, product: { status: "approved" } },
      },
      include: {
        variant: {
          select: {
            sku: true,
            product: { select: { title: true } },
          },
        },
      },
      orderBy: [{ onHand: "asc" }, { reserved: "desc" }],
      take: 500,
    }),
    prisma.returnRequest.findMany({
      where: { sellerId, status: { in: ["requested", "approved"] } },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { order: { select: { orderNumber: true } } },
    }),
    prisma.settlementBatch.findFirst({
      where: { sellerId, status: { in: ["pending", "held"] } },
      orderBy: { periodEnd: "asc" },
    }),
    prisma.product.findMany({
      where: { sellerId, status: { in: ["draft", "rejected", "submitted"] } },
      select: { id: true, title: true, status: true },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.taxProfile.findFirst({ where: { active: true } }),
    prisma.orderFulfilmentGroup.aggregate({
      where: {
        sellerId,
        status: { in: ["shipped", "delivered"] },
        updatedAt: { gte: weekAgo },
      },
      _sum: { lineTotalPaise: true },
    }),
    prisma.orderFulfilmentGroup.findMany({
      where: {
        sellerId,
        status: { in: ["shipped", "delivered"] },
        updatedAt: { gte: sixtyAgo },
      },
      select: { updatedAt: true, lineTotalPaise: true, orderId: true },
    }),
    prisma.settlementBatch.aggregate({
      where: { sellerId, status: { in: ["pending", "held"] } },
      _sum: { netPaise: true },
    }),
    prisma.product.count({ where: { sellerId, status: "approved" } }),
    prisma.product.count({ where: { sellerId, status: "submitted" } }),
    prisma.product.count({ where: { sellerId, status: "draft" } }),
    prisma.product.count({ where: { sellerId, status: "rejected" } }),
    prisma.orderFulfilmentGroup.count({
      where: {
        sellerId,
        status: "cancelled",
        cancelledAt: { gte: thirtyAgo },
      },
    }),
    prisma.orderFulfilmentGroup.count({
      where: {
        sellerId,
        status: "delivered",
        deliveredAt: { gte: thirtyAgo },
      },
    }),
    prisma.orderFulfilmentGroup.count({
      where: {
        sellerId,
        status: { in: ["shipped", "delivered"] },
        shippedAt: { gte: startOfToday },
      },
    }),
    prisma.orderFulfilmentGroup.count({
      where: {
        sellerId,
        status: "delivered",
        deliveredAt: { gte: startOfToday },
      },
    }),
    // Aggregate in JS — Prisma groupBy + relation filter can emit ambiguous
    // SQL for line_total_paise on Postgres.
    prisma.orderLine.findMany({
      where: {
        sellerId,
        fulfilmentGroup: {
          status: { in: ["shipped", "delivered"] },
          updatedAt: { gte: thirtyAgo },
        },
      },
      select: {
        productId: true,
        productTitle: true,
        quantity: true,
        lineTotalPaise: true,
      },
      take: 4000,
    }),
  ]);

  const dayMs = 24 * 60 * 60 * 1000;
  const thirtyMs = 30 * dayMs;
  const nowTs = Date.now();
  let sales30 = 0;
  let salesPrev30 = 0;
  const orders30 = new Set<string>();
  const ordersPrev30 = new Set<string>();
  const dayBuckets = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    dayBuckets.set(new Date(nowTs - i * dayMs).toISOString().slice(0, 10), 0);
  }
  for (const group of salesGroups) {
    const age = nowTs - group.updatedAt.getTime();
    if (age <= thirtyMs) {
      sales30 += group.lineTotalPaise;
      orders30.add(group.orderId);
      const key = group.updatedAt.toISOString().slice(0, 10);
      if (dayBuckets.has(key)) {
        dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + group.lineTotalPaise);
      }
    } else if (age <= 2 * thirtyMs) {
      salesPrev30 += group.lineTotalPaise;
      ordersPrev30.add(group.orderId);
    }
  }
  const trendPct = (cur: number, prev: number) =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
  const sales7d = Array.from(dayBuckets.entries())
    .slice(-7)
    .reduce((sum, [, paise]) => sum + paise, 0);

  const topProductMap = new Map<
    string,
    { productId: string; title: string; units: number; salesPaise: number }
  >();
  for (const row of topLineAgg) {
    const existing = topProductMap.get(row.productId);
    if (existing) {
      existing.units += row.quantity;
      existing.salesPaise += row.lineTotalPaise;
    } else {
      topProductMap.set(row.productId, {
        productId: row.productId,
        title: row.productTitle,
        units: row.quantity,
        salesPaise: row.lineTotalPaise,
      });
    }
  }
  const topProducts = Array.from(topProductMap.values())
    .sort((a, b) => b.salesPaise - a.salesPaise)
    .slice(0, 5);
  const units30d = topLineAgg.reduce((sum, row) => sum + row.quantity, 0);

  const metrics = {
    sales30dPaise: sales30,
    salesTrendPct: trendPct(sales30, salesPrev30),
    orders30d: orders30.size,
    ordersTrendPct: trendPct(orders30.size, ordersPrev30.size),
    payoutDuePaise: payoutAgg._sum.netPaise ?? 0,
    sales7dPaise: sales7d,
    units30d,
    shippedToday,
    deliveredToday,
    cancelled30d,
    dailySales: Array.from(dayBuckets.entries()).map(([key, paise]) => ({
      label: new Date(key).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      paise,
    })),
  };

  const stockRows = inventory
    .map((item) => ({
      inventoryItemId: item.id,
      sku: item.variant.sku,
      productTitle: item.variant.product.title,
      available: Math.max(item.onHand - item.reserved, 0),
      onHand: item.onHand,
      reserved: item.reserved,
    }))
    .sort((a, b) => a.available - b.available);
  const outOfStock = stockRows
    .filter((row) => row.available === 0)
    .slice(0, 20);
  const lowStock = stockRows
    .filter(
      (row) => row.available > 0 && row.available <= LOW_STOCK_AVAILABLE,
    )
    .slice(0, 20);

  const openShipCount = awaitingGroups.length;
  const lateCount = lateGroups.length;
  const shippedOrOpen30 =
    orders30.size + cancelled30d + openShipCount;
  const lateShipmentRatePct = ratePct(lateCount, Math.max(openShipCount, 1));
  const cancellationRatePct = ratePct(
    cancelled30d,
    Math.max(orders30.size + cancelled30d, 1),
  );
  const returnRatePct = ratePct(returns.length, Math.max(delivered30d, 1));
  const oosSkuRatePct = ratePct(outOfStock.length, Math.max(stockRows.length, 1));

  const targets = {
    lateShipmentMaxPct: 4,
    cancellationMaxPct: 2.5,
    returnMaxPct: 5,
    oosSkuMaxPct: 10,
  };
  const breaches = [
    lateShipmentRatePct > targets.lateShipmentMaxPct,
    cancellationRatePct > targets.cancellationMaxPct,
    returnRatePct > targets.returnMaxPct,
    oosSkuRatePct > targets.oosSkuMaxPct,
    seller.status !== "approved",
  ].filter(Boolean).length;
  const rating: SellerActionDashboard["accountHealth"]["rating"] =
    breaches >= 2 || seller.status !== "approved"
      ? "critical"
      : breaches === 1
        ? "at_risk"
        : "healthy";

  const now = Date.now();
  const capabilities = {
    catalogue:
      seller.ownerUserId === actor.userId ||
      actorHasSellerCapability(actor, sellerId, "catalogue.write"),
    fulfilment:
      seller.ownerUserId === actor.userId ||
      actorHasSellerCapability(actor, sellerId, "fulfilment.write"),
    returns:
      seller.ownerUserId === actor.userId ||
      actorHasSellerCapability(actor, sellerId, "returns.review"),
    finance:
      seller.ownerUserId === actor.userId ||
      actorHasSellerCapability(actor, sellerId, "finance.read"),
  };

  const alerts: SellerActionDashboard["alerts"] = [];
  if (seller.status !== "approved") {
    alerts.push({
      id: "kyc",
      priority: "critical",
      title: "Complete seller verification",
      detail: `Current KYC status: ${seller.status}`,
      href: "/seller/onboarding",
    });
  }
  if (lateGroups.length > 0) {
    alerts.push({
      id: "late",
      priority: "critical",
      title: `${lateGroups.length} late fulfilment group(s)`,
      detail: `Pending/processing longer than ${LATE_FULFILMENT_HOURS}h`,
      href: "/seller/fulfilment",
    });
  }
  if (returns.length > 0) {
    alerts.push({
      id: "returns",
      priority: "action",
      title: `${returns.length} open return(s)`,
      detail: "Customer returns awaiting seller review",
      href: "/seller/returns",
    });
  }
  if (outOfStock.length > 0) {
    alerts.push({
      id: "oos",
      priority: "critical",
      title: `${outOfStock.length} out-of-stock SKU(s)`,
      detail: "Available units = 0 — listings risk suppression",
      href: "/seller/inventory?filter=out_of_stock",
    });
  }
  if (lowStock.length > 0) {
    alerts.push({
      id: "stock",
      priority: "action",
      title: `${lowStock.length} low-stock SKU(s)`,
      detail: `Available units 1–${LOW_STOCK_AVAILABLE}`,
      href: "/seller/inventory?filter=low_stock",
    });
  }
  if (drafts.length > 0) {
    alerts.push({
      id: "drafts",
      priority: "info",
      title: `${drafts.length} catalogue item(s) need attention`,
      detail: "Draft, submitted, or rejected listings",
      href: "/seller/catalogue",
    });
  }
  if (!taxProfile) {
    alerts.push({
      id: "tax",
      priority: "info",
      title: "No active tax profile",
      detail: "Platform tax configuration is not active yet",
      href: "/seller/compliance",
    });
  } else {
    alerts.push({
      id: "tax-ok",
      priority: "completed",
      title: "Active tax profile present",
      detail: `${taxProfile.name.replace(/placeholder/gi, "standard")} — Not a legal GST/TCS determination`,
      href: "/seller/compliance",
    });
  }
  if (seller.status === "approved") {
    alerts.push({
      id: "kyc-ok",
      priority: "completed",
      title: "Seller profile approved",
      detail: "KYC approved",
      href: "/seller/profile",
    });
  }

  // shippedOrOpen30 kept for future health expansions
  void shippedOrOpen30;

  return {
    sellerId: seller.id,
    tradeName: seller.tradeName,
    legalName: seller.legalName,
    kycStatus: seller.status,
    gstinMasked: seller.gstinMasked,
    taxProfileActive: Boolean(taxProfile),
    lateFulfilment: lateGroups.map((group) => ({
      id: group.id,
      orderNumber: group.order.orderNumber,
      status: group.status,
      ageHours: Math.floor(
        (now - group.createdAt.getTime()) / (60 * 60 * 1000),
      ),
      lineTotalPaise: group.lineTotalPaise,
    })),
    awaitingFulfilment: awaitingGroups.map((group) => {
      const itemCount = group.lines.reduce((sum, line) => sum + line.quantity, 0);
      const shipBy = new Date(
        group.createdAt.getTime() + SHIP_SLA_HOURS * 60 * 60 * 1000,
      );
      return {
        id: group.id,
        orderNumber: group.order.orderNumber,
        status: group.status,
        lineTotalPaise: group.lineTotalPaise,
        ageHours: Math.floor(
          (now - group.createdAt.getTime()) / (60 * 60 * 1000),
        ),
        createdAt: group.createdAt.toISOString(),
        shipByAt: shipBy.toISOString(),
        itemCount,
        city: group.order.address.city,
        postalCode: group.order.address.postalCode,
        firstTitle: group.lines[0]?.productTitle ?? "Items",
      };
    }),
    outOfStock,
    lowStock,
    draftProducts: drafts,
    openReturns: returns.map((row) => ({
      id: row.id,
      orderNumber: row.order.orderNumber,
      status: row.status,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    })),
    nextSettlement: settlement
      ? {
          id: settlement.id,
          batchNumber: settlement.batchNumber,
          status: settlement.status,
          netPaise: settlement.netPaise,
          netFormatted: formatPaise(settlement.netPaise),
          periodEnd: settlement.periodEnd.toISOString(),
        }
      : null,
    recentSalesPaise: recentPaid._sum.lineTotalPaise ?? 0,
    catalogue: {
      live: liveCount,
      submitted: submittedCount,
      draft: draftCount,
      rejected: rejectedCount,
      totalSkus: stockRows.length,
      inStockSkus: stockRows.filter((row) => row.available > 0).length,
    },
    metrics,
    accountHealth: {
      rating,
      lateShipmentRatePct,
      cancellationRatePct,
      returnRatePct,
      oosSkuRatePct,
      targets,
    },
    topProducts,
    alerts,
    capabilities,
  };
}

export function capabilityAllowed(
  actor: Actor,
  sellerId: string,
  capability: SellerCapability,
) {
  return actorHasSellerCapability(actor, sellerId, capability);
}
