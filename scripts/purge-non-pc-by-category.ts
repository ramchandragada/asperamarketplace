/**
 * Archive + hard-delete products in non-PC categories, then deactivate/remove
 * those categories. Safe for closed-catalogue seller offers (they sit on PC
 * category rows). Prefer this over slug-based hard-purge.
 *
 * Usage:
 *   DATABASE_URL=... pnpm exec tsx scripts/purge-non-pc-by-category.ts
 *   DATABASE_URL=... pnpm exec tsx scripts/purge-non-pc-by-category.ts --dry-run
 */
import { PrismaClient } from "@prisma/client";
import { PC_CATEGORY_SLUGS } from "../src/modules/catalogue/pc-catalogue-data";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const pcSlugs = [...PC_CATEGORY_SLUGS];

  const nonPcCategories = await prisma.category.findMany({
    where: { slug: { notIn: pcSlugs } },
    select: {
      id: true,
      slug: true,
      name: true,
      isActive: true,
      _count: { select: { products: true } },
    },
    orderBy: { slug: "asc" },
  });

  const nonPcCategoryIds = nonPcCategories.map((c) => c.id);
  const junkProducts = nonPcCategoryIds.length
    ? await prisma.product.findMany({
        where: { categoryId: { in: nonPcCategoryIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          category: { select: { slug: true, name: true } },
          seller: { select: { tradeName: true } },
        },
        orderBy: { title: "asc" },
      })
    : [];

  console.log(
    JSON.stringify(
      {
        dryRun,
        nonPcCategories: nonPcCategories.map((c) => ({
          slug: c.slug,
          name: c.name,
          isActive: c.isActive,
          products: c._count.products,
        })),
        junkProductCount: junkProducts.length,
        sample: junkProducts.slice(0, 20).map((p) => ({
          title: p.title,
          status: p.status,
          category: p.category.name,
          seller: p.seller.tradeName,
        })),
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    console.log("Dry run — no writes");
    return;
  }

  const junkIds = junkProducts.map((p) => p.id);
  const counts: Record<string, number> = {};

  await prisma.$transaction(
    async (tx) => {
      if (junkIds.length > 0) {
        // Soft-hide first so storefront is clean even if hard-delete is blocked.
        counts.archived = (
          await tx.product.updateMany({
            where: { id: { in: junkIds }, status: { not: "archived" } },
            data: {
              status: "archived",
              statusReason: "Non-PC / test fixture removed from storefront",
              publishedAt: null,
            },
          })
        ).count;

        const variantIds = (
          await tx.productVariant.findMany({
            where: { productId: { in: junkIds } },
            select: { id: true },
          })
        ).map((v) => v.id);

        if (variantIds.length) {
          counts.cartItems = (
            await tx.cartItem.deleteMany({
              where: { variantId: { in: variantIds } },
            })
          ).count;

          const inventoryIds = (
            await tx.inventoryItem.findMany({
              where: { variantId: { in: variantIds } },
              select: { id: true },
            })
          ).map((i) => i.id);

          if (inventoryIds.length) {
            counts.stockMovements = (
              await tx.stockMovement.deleteMany({
                where: { inventoryItemId: { in: inventoryIds } },
              })
            ).count;
            counts.inventory = (
              await tx.inventoryItem.deleteMany({
                where: { id: { in: inventoryIds } },
              })
            ).count;
          }

          counts.wishlist = (
            await tx.wishlistItem.deleteMany({
              where: { productId: { in: junkIds } },
            })
          ).count;
          counts.reviews = (
            await tx.productReview.deleteMany({
              where: { productId: { in: junkIds } },
            })
          ).count;
          counts.images = (
            await tx.productImage.deleteMany({
              where: { productId: { in: junkIds } },
            })
          ).count;

          // Order-linked products cannot be hard-deleted; leave archived.
          const blocked = new Set(
            (
              await tx.orderLine.findMany({
                where: { productId: { in: junkIds } },
                select: { productId: true },
                distinct: ["productId"],
              })
            ).map((r) => r.productId),
          );
          const deletable = junkIds.filter((id) => !blocked.has(id));
          counts.blockedByOrders = blocked.size;

          if (deletable.length) {
            const deletableVariants = (
              await tx.productVariant.findMany({
                where: { productId: { in: deletable } },
                select: { id: true },
              })
            ).map((v) => v.id);
            if (deletableVariants.length) {
              counts.variants = (
                await tx.productVariant.deleteMany({
                  where: { id: { in: deletableVariants } },
                })
              ).count;
            }
            counts.productsDeleted = (
              await tx.product.deleteMany({
                where: { id: { in: deletable } },
              })
            ).count;
          }
        }
      }

      counts.categoriesDeactivated = (
        await tx.category.updateMany({
          where: { slug: { notIn: pcSlugs } },
          data: { isActive: false },
        })
      ).count;

      counts.categoriesDeleted = (
        await tx.category.deleteMany({
          where: {
            slug: { notIn: pcSlugs },
            products: { none: {} },
          },
        })
      ).count;
    },
    { timeout: 120_000 },
  );

  console.log(JSON.stringify({ ok: true, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
