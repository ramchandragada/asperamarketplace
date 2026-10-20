/**
 * Mark the newest paid customer order as delivered so seller-rating unlocks.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/mark-demo-order-delivered.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const customer = await prisma.user.findUnique({
    where: { email: "customer@aspera.local" },
  });
  if (!customer) {
    throw new Error("customer@aspera.local not found");
  }

  const order = await prisma.order.findFirst({
    where: {
      userId: customer.id,
      paidAt: { not: null },
      groups: { some: { status: { not: "delivered" } } },
    },
    include: { groups: { include: { shipment: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!order) {
    console.log("No paid undelivered order for customer — nothing to do");
    return;
  }

  const now = new Date();
  for (const group of order.groups) {
    if (group.status === "delivered" || group.status === "cancelled") continue;
    await prisma.orderFulfilmentGroup.update({
      where: { id: group.id },
      data: {
        status: "delivered",
        shippedAt: group.shippedAt ?? now,
        deliveredAt: now,
      },
    });
    if (group.shipment) {
      await prisma.shipment.update({
        where: { id: group.shipment.id },
        data: { status: "delivered" },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        groups: order.groups.length,
        status: "delivered",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
