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
};

export async function getAdminHomeDashboard(
  actor: Actor,
): Promise<AdminHomeDashboard> {
  requireAdmin(actor);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    sellersPending,
    productsPending,
    openRisk,
    openCounterfeit,
    pendingReviews,
    openPrivacy,
    recentAuditCount,
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
  ]);

  return {
    sellersPending,
    productsPending,
    openRisk,
    openCounterfeit,
    pendingReviews,
    openPrivacy,
    recentAuditCount,
  };
}
