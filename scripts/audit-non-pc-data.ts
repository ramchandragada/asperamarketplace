import { PrismaClient } from "@prisma/client";
import {
  PC_BRANDS,
  PC_CATEGORIES,
  PC_PRODUCTS,
  PC_SELLERS,
} from "../src/modules/catalogue/pc-catalogue-data";

const prisma = new PrismaClient();

async function main() {
  const pcCategorySlugs = PC_CATEGORIES.map((c) => c.slug);
  const pcProductSlugs = PC_PRODUCTS.map((p) => p.slug);
  const pcBrandSlugs = PC_BRANDS.map((b) => b.slug);
  const pcSellerKeys = PC_SELLERS.map((s) => s.key);
  const pcSellerEmails = pcSellerKeys.map((k) => `${k}@aspera.local`);

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      slug: true,
      isActive: true,
      _count: { select: { products: true } },
    },
    orderBy: { slug: "asc" },
  });
  const nonPcCats = categories.filter((c) => !pcCategorySlugs.includes(c.slug));
  const pcCats = categories.filter((c) => pcCategorySlugs.includes(c.slug));

  const productsNonPc = await prisma.product.count({
    where: { slug: { notIn: pcProductSlugs } },
  });
  const productsPc = await prisma.product.count({
    where: { slug: { in: pcProductSlugs } },
  });
  const productsByStatus = await prisma.product.groupBy({
    by: ["status"],
    _count: true,
  });

  const sellers = await prisma.seller.findMany({
    select: {
      id: true,
      tradeName: true,
      legalName: true,
      contactEmail: true,
      status: true,
      owner: { select: { email: true } },
      _count: { select: { products: true } },
    },
  });
  const pcSellerEmailsSet = new Set(pcSellerEmails);
  const pcSellers = sellers.filter(
    (s) =>
      pcSellerEmailsSet.has(s.contactEmail) ||
      pcSellerEmailsSet.has(s.owner.email) ||
      /pune|digitaldeck|techzone|gadget|city computers/i.test(
        `${s.tradeName} ${s.legalName}`,
      ),
  );
  // Better: match by PC_SELLERS trade names
  const pcTradeNames = new Set(PC_SELLERS.map((s) => s.tradeName));
  const keepSellers = sellers.filter(
    (s) =>
      pcTradeNames.has(s.tradeName ?? "") ||
      pcSellerEmailsSet.has(s.contactEmail) ||
      pcSellerEmailsSet.has(s.owner.email),
  );
  const keepSellerIds = new Set(keepSellers.map((s) => s.id));
  const nonPcSellers = sellers.filter((s) => !keepSellerIds.has(s.id));

  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      _count: { select: { products: true } },
    },
  });
  const nonPcBrands = brands.filter((b) => !pcBrandSlugs.includes(b.slug));

  const nonPcProductIds = (
    await prisma.product.findMany({
      where: { slug: { notIn: pcProductSlugs } },
      select: { id: true },
    })
  ).map((p) => p.id);

  const orderLines = nonPcProductIds.length
    ? await prisma.orderLine.count({
        where: { productId: { in: nonPcProductIds } },
      })
    : 0;
  const cartLines = nonPcProductIds.length
    ? await prisma.cartItem.count({
        where: { variant: { productId: { in: nonPcProductIds } } },
      })
    : 0;
  const images = nonPcProductIds.length
    ? await prisma.productImage.count({
        where: { productId: { in: nonPcProductIds } },
      })
    : 0;
  const reviews = nonPcProductIds.length
    ? await prisma.productReview.count({
        where: { productId: { in: nonPcProductIds } },
      })
    : 0;

  const ordersWithNonPc = nonPcProductIds.length
    ? await prisma.order.count({
        where: {
          lines: { some: { productId: { in: nonPcProductIds } } },
        },
      })
    : 0;

  console.log(
    JSON.stringify(
      {
        pcSoT: {
          categories: pcCategorySlugs.length,
          brands: pcBrandSlugs.length,
          products: pcProductSlugs.length,
          sellers: PC_SELLERS.length,
          sellerTradeNames: PC_SELLERS.map((s) => s.tradeName),
        },
        categories: {
          pc: pcCats.map((c) => ({
            slug: c.slug,
            active: c.isActive,
            products: c._count.products,
          })),
          nonPc: nonPcCats.map((c) => ({
            slug: c.slug,
            active: c.isActive,
            products: c._count.products,
          })),
        },
        products: {
          pc: productsPc,
          nonPc: productsNonPc,
          byStatus: productsByStatus,
        },
        sellers: {
          keep: keepSellers.map((s) => ({
            tradeName: s.tradeName,
            email: s.contactEmail,
            products: s._count.products,
          })),
          delete: nonPcSellers.map((s) => ({
            tradeName: s.tradeName,
            email: s.contactEmail,
            ownerEmail: s.owner.email,
            products: s._count.products,
          })),
        },
        brands: {
          pc: brands.length - nonPcBrands.length,
          nonPc: nonPcBrands.map((b) => ({
            slug: b.slug,
            name: b.name,
            products: b._count.products,
          })),
        },
        related: {
          nonPcProductIds: nonPcProductIds.length,
          orderLines,
          ordersWithNonPc,
          cartLines,
          images,
          reviews,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
