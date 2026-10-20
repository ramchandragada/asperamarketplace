import { KNOWN_COUPONS } from "@/modules/cart/pricing";
import { maskGstin } from "@/modules/identity/crypto";
import type { Actor } from "@/modules/identity/policy";
import type { UpdateBuyerProfileInput } from "@/modules/account/schema";
import { prisma } from "@/platform/db/prisma";

export class AccountValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "AccountValidationError";
  }
}

export async function getBuyerProfile(actor: Actor) {
  return prisma.buyerProfile.findUnique({ where: { userId: actor.userId } });
}

export async function upsertBuyerProfile(
  actor: Actor,
  input: UpdateBuyerProfileInput,
  correlationId: string,
) {
  const existing = await prisma.buyerProfile.findUnique({
    where: { userId: actor.userId },
  });

  const data = {
    businessName:
      input.businessName !== undefined
        ? input.businessName.length > 0
          ? input.businessName
          : null
        : (existing?.businessName ?? null),
    gstin:
      input.gstin !== undefined
        ? input.gstin.length > 0
          ? input.gstin
          : null
        : (existing?.gstin ?? null),
    taxInvoicePreferred:
      input.taxInvoicePreferred ?? existing?.taxInvoicePreferred ?? false,
    preferredPaymentMethod:
      input.preferredPaymentMethod ??
      existing?.preferredPaymentMethod ??
      "mock",
  };

  return prisma.$transaction(async (tx) => {
    const profile = await tx.buyerProfile.upsert({
      where: { userId: actor.userId },
      create: { userId: actor.userId, ...data },
      update: data,
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "buyer_profile.updated",
        targetType: "buyer_profile",
        targetId: profile.id,
        afterState: {
          businessName: profile.businessName,
          gstinMasked: profile.gstin ? maskGstin(profile.gstin) : null,
          taxInvoicePreferred: profile.taxInvoicePreferred,
          preferredPaymentMethod: profile.preferredPaymentMethod,
        },
        reason: "Customer updated business / purchase preferences",
        correlationId,
      },
    });
    return profile;
  });
}

export async function listBuyerReviews(actor: Actor) {
  return prisma.productReview.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Delivered lines the buyer has not yet reviewed. */
export async function listPendingReviews(actor: Actor) {
  const deliveredLines = await prisma.orderLine.findMany({
    where: {
      order: { userId: actor.userId, paidAt: { not: null } },
      fulfilmentGroup: { status: "delivered" },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      productId: true,
      productTitle: true,
      variantTitle: true,
      orderId: true,
      order: { select: { orderNumber: true, createdAt: true } },
    },
  });

  const reviewed = await prisma.productReview.findMany({
    where: {
      userId: actor.userId,
      productId: { in: [...new Set(deliveredLines.map((l) => l.productId))] },
    },
    select: { productId: true, orderId: true },
  });
  const reviewedKeys = new Set(
    reviewed.map((r) => `${r.productId}:${r.orderId ?? ""}`),
  );

  const seenProducts = new Set<string>();
  const pending: typeof deliveredLines = [];
  for (const line of deliveredLines) {
    const key = `${line.productId}:${line.orderId}`;
    if (reviewedKeys.has(key) || reviewedKeys.has(`${line.productId}:`)) {
      continue;
    }
    if (seenProducts.has(line.productId)) continue;
    seenProducts.add(line.productId);
    pending.push(line);
  }
  return pending;
}

export async function listBuyerNotifications(actor: Actor) {
  return prisma.notificationMessage.findMany({
    where: { recipient: actor.email },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listCouponWallet(actor: Actor) {
  const orders = await prisma.order.findMany({
    where: {
      userId: actor.userId,
      discountPaise: { gt: 0 },
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      orderNumber: true,
      discountPaise: true,
      createdAt: true,
      snapshot: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const usedCodes = new Map<
    string,
    Array<{ orderNumber: string; discountPaise: number; at: string }>
  >();

  for (const order of orders) {
    const snapshot = order.snapshot as {
      coupon?: { code?: string | null; accepted?: boolean };
    } | null;
    const code = snapshot?.coupon?.code?.toUpperCase();
    if (!code || !snapshot?.coupon?.accepted) continue;
    const list = usedCodes.get(code) ?? [];
    list.push({
      orderNumber: order.orderNumber,
      discountPaise: order.discountPaise,
      at: order.createdAt.toISOString(),
    });
    usedCodes.set(code, list);
  }

  const catalogue = Object.entries(KNOWN_COUPONS).map(([code, meta]) => {
    const uses = usedCodes.get(code) ?? [];
    return {
      code,
      title: meta.explanation,
      discountBps: meta.discountBps,
      maxDiscountPaise: meta.maxDiscountPaise,
      status: "available" as const,
      uses,
    };
  });

  return {
    available: catalogue,
    used: catalogue
      .filter((c) => c.uses.length > 0)
      .flatMap((c) =>
        c.uses.map((use) => ({
          code: c.code,
          title: c.title,
          status: "used" as const,
          ...use,
        })),
      ),
    expired: [] as Array<{
      code: string;
      title: string;
      status: "expired";
    }>,
  };
}

export async function buildSpendReport(actor: Actor) {
  const orders = await prisma.order.findMany({
    where: {
      userId: actor.userId,
      status: { in: ["paid", "fulfilled", "partially_cancelled"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      lines: {
        select: {
          sellerId: true,
          productTitle: true,
          quantity: true,
          lineTotalPaise: true,
        },
      },
      groups: {
        select: {
          sellerId: true,
          seller: { select: { tradeName: true, legalName: true } },
        },
      },
    },
  });

  const sellerNames = new Map<string, string>();
  for (const order of orders) {
    for (const group of order.groups) {
      sellerNames.set(
        group.sellerId,
        group.seller.tradeName || group.seller.legalName,
      );
    }
  }

  const rows: Array<{
    date: string;
    orderNumber: string;
    orderStatus: string;
    seller: string;
    productTitle: string;
    quantity: number;
    lineTotalPaise: number;
    orderTotalPaise: number;
  }> = [];

  for (const order of orders) {
    for (const line of order.lines) {
      rows.push({
        date: order.createdAt.toISOString().slice(0, 10),
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        seller: sellerNames.get(line.sellerId) ?? line.sellerId.slice(0, 8),
        productTitle: line.productTitle,
        quantity: line.quantity,
        lineTotalPaise: line.lineTotalPaise,
        orderTotalPaise: order.totalPaise,
      });
    }
  }

  const totalSpendPaise = orders.reduce((sum, o) => sum + o.totalPaise, 0);
  const bySeller = new Map<string, number>();
  for (const row of rows) {
    bySeller.set(row.seller, (bySeller.get(row.seller) ?? 0) + row.lineTotalPaise);
  }

  return {
    rows,
    summary: {
      orderCount: orders.length,
      lineCount: rows.length,
      totalSpendPaise,
      bySeller: [...bySeller.entries()].map(([seller, merchandisePaise]) => ({
        seller,
        merchandisePaise,
      })),
    },
  };
}

export function spendReportToCsv(
  rows: Awaited<ReturnType<typeof buildSpendReport>>["rows"],
): string {
  const header = [
    "date",
    "order_number",
    "order_status",
    "seller",
    "product",
    "quantity",
    "line_total_inr",
    "order_total_inr",
  ];
  const lines = rows.map((row) =>
    [
      row.date,
      row.orderNumber,
      row.orderStatus,
      csvEscape(row.seller),
      csvEscape(row.productTitle),
      String(row.quantity),
      (row.lineTotalPaise / 100).toFixed(2),
      (row.orderTotalPaise / 100).toFixed(2),
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
