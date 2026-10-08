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

  const [
    lateGroups,
    awaitingGroups,
    inventory,
    returns,
    settlement,
    drafts,
    taxProfile,
    recentPaid,
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
      take: 20,
      include: { order: { select: { orderNumber: true } } },
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
  ]);

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
      detail: "Available units = 0",
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
      detail: "Draft, submitted, or rejected listings — filter on the catalogue page",
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
    awaitingFulfilment: awaitingGroups.map((group) => ({
      id: group.id,
      orderNumber: group.order.orderNumber,
      status: group.status,
      lineTotalPaise: group.lineTotalPaise,
    })),
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
