/**
 * Archive every product that is not in the PC catalogue source of truth
 * (`PC_PRODUCTS` / `PC_CATEGORIES`). Deactivates non-PC categories.
 * No hard deletes — orders/cart FKs stay intact. Idempotent.
 */
import { PrismaClient } from "@prisma/client";
import {
  PC_CATEGORIES,
  PC_PRODUCTS,
} from "../src/modules/catalogue/pc-catalogue-data";

const prisma = new PrismaClient();

async function main() {
  const pcCategorySlugs = PC_CATEGORIES.map((c) => c.slug);
  const pcProductSlugs = PC_PRODUCTS.map((p) => p.slug);

  const sample = await prisma.product.findMany({
    where: {
      status: { not: "archived" },
      slug: { notIn: pcProductSlugs },
    },
    select: {
      title: true,
      slug: true,
      status: true,
      category: { select: { slug: true } },
      seller: { select: { tradeName: true } },
    },
    take: 40,
    orderBy: { updatedAt: "desc" },
  });

  console.log(
    JSON.stringify(
      {
        pcCategories: pcCategorySlugs.length,
        pcProducts: pcProductSlugs.length,
        sampleToArchive: sample,
      },
      null,
      2,
    ),
  );

  const archived = await prisma.product.updateMany({
    where: {
      status: { not: "archived" },
      slug: { notIn: pcProductSlugs },
    },
    data: { status: "archived" },
  });

  const deactivated = await prisma.category.updateMany({
    where: { slug: { notIn: pcCategorySlugs } },
    data: { isActive: false },
  });

  // Ensure PC categories stay active.
  await prisma.category.updateMany({
    where: { slug: { in: pcCategorySlugs } },
    data: { isActive: true },
  });

  const approvedPc = await prisma.product.count({
    where: {
      status: "approved",
      slug: { in: pcProductSlugs },
    },
  });
  const approvedOther = await prisma.product.count({
    where: {
      status: "approved",
      slug: { notIn: pcProductSlugs },
    },
  });
  const statusAfter = await prisma.product.groupBy({
    by: ["status"],
    _count: true,
  });

  const newest = await prisma.product.findMany({
    where: { status: "approved" },
    select: {
      title: true,
      category: { select: { slug: true } },
      seller: { select: { tradeName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  console.log(
    JSON.stringify(
      {
        archivedCount: archived.count,
        deactivatedCategories: deactivated.count,
        approvedPc,
        approvedOtherRemaining: approvedOther,
        statusAfter,
        newestApproved: newest,
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
