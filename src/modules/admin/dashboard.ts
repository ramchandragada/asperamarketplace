import { prisma } from "@/platform/db/prisma";
import { requireAdmin, type Actor } from "@/modules/identity/policy";

export type AdminHomeDashboard = {
  sellersPending: number;
  productsPending: number;
  openRisk: number;
  openCounterfeit: number;
  pendingReviews: number;
  openPrivacy: number;
  recentAuditCount: number;
  metrics: {
    gmv30dPaise: number;
    gmvTrendPct: number | null;
    orders30d: number;
    ordersTrendPct: number | null;
    activeSellers: number;
    dailyGmv: Array<{ label: string; paise: number }>;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalPaise: number;
    status: string;
    createdAt: string;
  }>;
};

export async function getAdminHomeDashboard(
  actor: Actor,
): Promise<AdminHomeDashboard> {
  requireAdmin(actor);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sixtyAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [
    sellersPending,
    productsPending,
    openRisk,
    openCounterfeit,
    pendingReviews,
    openPrivacy,
    recentAuditCount,
    activeSellers,
    paidOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.seller.count({
      where: { status: { in: ["submitted", "under_review"] } },
    }),
    prisma.product.count({ where: { status: "submitted" } }),
    prisma.riskCase.count({
      where: { status: { in: ["open", "investigating"] } },
    }),
    prisma.counterfeitCase.count({
      where: { status: { in: ["reported", "under_review"] } },
    }),
    prisma.productReview.count({ where: { status: "pending" } }),
    prisma.privacyRequest.count({
      where: { status: { in: ["received", "in_progress"] } },
    }),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: weekAgo },
        NOT: { action: { startsWith: "cart." } },
      },
    }),
    prisma.seller.count({ where: { status: "approved" } }),
    prisma.order.findMany({
      where: { paidAt: { gte: sixtyAgo } },
      select: { paidAt: true, totalPaise: true },
    }),
    prisma.order.findMany({
      where: { status: { in: ["paid", "fulfilled", "partially_cancelled"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        totalPaise: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  // Platform GMV / orders over 30 days, trend vs the prior 30 days, daily series.
  const dayMs = 24 * 60 * 60 * 1000;
  const thirtyMs = 30 * dayMs;
  const nowTs = Date.now();
  let gmv30 = 0;
  let gmvPrev30 = 0;
  let orders30 = 0;
  let ordersPrev30 = 0;
  const dayBuckets = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    dayBuckets.set(new Date(nowTs - i * dayMs).toISOString().slice(0, 10), 0);
  }
  for (const order of paidOrders) {
    if (!order.paidAt) continue;
    const age = nowTs - order.paidAt.getTime();
    if (age <= thirtyMs) {
      gmv30 += order.totalPaise;
      orders30 += 1;
      const key = order.paidAt.toISOString().slice(0, 10);
      if (dayBuckets.has(key)) {
        dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + order.totalPaise);
      }
    } else if (age <= 2 * thirtyMs) {
      gmvPrev30 += order.totalPaise;
      ordersPrev30 += 1;
    }
  }
  const trendPct = (cur: number, prev: number) =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

  return {
    sellersPending,
    productsPending,
    openRisk,
    openCounterfeit,
    pendingReviews,
    openPrivacy,
    recentAuditCount,
    metrics: {
      gmv30dPaise: gmv30,
      gmvTrendPct: trendPct(gmv30, gmvPrev30),
      orders30d: orders30,
      ordersTrendPct: trendPct(orders30, ordersPrev30),
      activeSellers,
      dailyGmv: Array.from(dayBuckets.entries()).map(([key, paise]) => ({
        label: new Date(key).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        paise,
      })),
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalPaise: o.totalPaise,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
  };
}
