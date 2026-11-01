/** Snapshot sellers + product counts for go-live cleanup. */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sellers = await prisma.seller.findMany({
    select: {
      id: true,
      tradeName: true,
      legalName: true,
      status: true,
      gstin: true,
      contactEmail: true,
      owner: { select: { email: true } },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: { tradeName: "asc" },
  });

  const bySeller = [];
  for (const s of sellers) {
    const approved = await prisma.product.count({
      where: { sellerId: s.id, status: "approved" },
    });
    const byStatus = await prisma.product.groupBy({
      by: ["status"],
      where: { sellerId: s.id },
      _count: true,
    });
    bySeller.push({
      tradeName: s.tradeName,
      legalName: s.legalName,
      status: s.status,
      gstin: s.gstin,
      email: s.contactEmail,
      ownerEmail: s.owner.email,
      products: s._count.products,
      approved,
      byStatus: Object.fromEntries(
        byStatus.map((r) => [r.status, r._count]),
      ),
    });
  }

  const totals = {
    sellers: sellers.length,
    products: await prisma.product.count(),
    approvedProducts: await prisma.product.count({
      where: { status: "approved" },
    }),
  };

  console.log(JSON.stringify({ totals, bySeller }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
