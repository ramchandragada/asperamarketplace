import type { OrderStatus, Prisma } from "@prisma/client";
import { requireAdmin, type Actor } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";
import { OrderValidationError } from "@/modules/orders/service";

export const ADMIN_ORDER_STATUSES = [
  "awaiting_payment",
  "paid",
  "payment_failed",
  "cancelled",
  "partially_cancelled",
  "fulfilled",
] as const satisfies readonly OrderStatus[];

export type AdminOrderStatusFilter = (typeof ADMIN_ORDER_STATUSES)[number] | "all";

export function parseAdminOrderStatus(
  raw: string | undefined,
): AdminOrderStatusFilter {
  if (!raw || raw === "all") return "all";
  if ((ADMIN_ORDER_STATUSES as readonly string[]).includes(raw)) {
    return raw as OrderStatus;
  }
  return "all";
}

export async function listAdminOrders(
  actor: Actor,
  options?: {
    status?: AdminOrderStatusFilter;
    q?: string;
    page?: number;
    pageSize?: number;
  },
) {
  requireAdmin(actor);
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 25));
  const q = options?.q?.trim();
  const status = options?.status ?? "all";

  const where: Prisma.OrderWhereInput = {
    ...(status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { displayName: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items, statusGroups] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        groups: {
          include: {
            seller: { select: { id: true, tradeName: true, legalName: true } },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, status: true, amountPaise: true },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { totalPaise: true },
    }),
  ]);

  const counts = Object.fromEntries(
    ADMIN_ORDER_STATUSES.map((key) => [key, 0]),
  ) as Record<OrderStatus, number>;
  let allCount = 0;
  for (const row of statusGroups) {
    counts[row.status] = row._count._all;
    allCount += row._count._all;
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    page: Math.min(page, pageCount),
    pageSize,
    total,
    pageCount,
    counts: { all: allCount, ...counts },
    totalsByStatus: statusGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      totalPaise: row._sum.totalPaise ?? 0,
    })),
  };
}

export async function getAdminOrder(actor: Actor, orderId: string) {
  requireAdmin(actor);
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      address: true,
      lines: true,
      groups: {
        include: {
          seller: { select: { id: true, tradeName: true, legalName: true } },
          shipment: true,
          lines: true,
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      refunds: true,
      returnRequests: true,
    },
  });
  if (!order) {
    throw new OrderValidationError("Order not found");
  }

  const [ledgerEntries, auditEvents] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        sourceEvent: true,
        memo: true,
        postedAt: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { targetType: "order", targetId: order.id },
          {
            targetType: "payment_attempt",
            targetId: { in: order.payments.map((payment) => payment.id) },
          },
          {
            targetType: "fulfilment_group",
            targetId: { in: order.groups.map((group) => group.id) },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        actorId: true,
        createdAt: true,
      },
    }),
  ]);

  return { order, ledgerEntries, auditEvents };
}
