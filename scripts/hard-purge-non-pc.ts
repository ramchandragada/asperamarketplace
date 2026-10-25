/**
 * HARD DELETE all non-PC marketplace data.
 * Keeps only PC_CATEGORIES / PC_BRANDS / PC_PRODUCTS / PC_SELLERS.
 */
import { PrismaClient } from "@prisma/client";
import {
  PC_BRANDS,
  PC_CATEGORIES,
  PC_PRODUCTS,
  PC_SELLERS,
} from "../src/modules/catalogue/pc-catalogue-data";

const prisma = new PrismaClient();

async function main() {
  const pcProductSlugs = PC_PRODUCTS.map((p) => p.slug);
  const pcCategorySlugs = PC_CATEGORIES.map((c) => c.slug);
  const pcBrandSlugs = PC_BRANDS.map((b) => b.slug);
  const keepSellerEmails = [...PC_SELLERS.map((s) => `${s.key}@aspera.local`)];
  const keepTradeNames = [...PC_SELLERS.map((s) => s.tradeName)];

  const nonPcIds = (
    await prisma.product.findMany({
      where: { slug: { notIn: pcProductSlugs } },
      select: { id: true },
    })
  ).map((p) => p.id);

  const keepSellers = await prisma.seller.findMany({
    where: {
      OR: [
        { contactEmail: { in: keepSellerEmails } },
        { tradeName: { in: keepTradeNames } },
        { owner: { email: { in: keepSellerEmails } } },
      ],
    },
    select: { id: true, tradeName: true, contactEmail: true, ownerUserId: true },
  });
  const keepSellerIds = new Set(keepSellers.map((s) => s.id));
  const purgeSellers = (
    await prisma.seller.findMany({
      select: {
        id: true,
        tradeName: true,
        contactEmail: true,
        ownerUserId: true,
      },
    })
  ).filter((s) => !keepSellerIds.has(s.id));
  const purgeSellerIds = purgeSellers.map((s) => s.id);

  console.log(
    JSON.stringify(
      {
        willDeleteProducts: nonPcIds.length,
        willDeleteSellers: purgeSellers.map((s) => s.tradeName),
        willKeepSellers: keepSellers.map((s) => s.tradeName),
      },
      null,
      2,
    ),
  );

  const counts: Record<string, number> = {};

  await prisma.$transaction(
    async (tx) => {
      if (nonPcIds.length > 0) {
        const variantIds = (
          await tx.productVariant.findMany({
            where: { productId: { in: nonPcIds } },
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
        }

        const dirtyOrderIds = (
          await tx.orderLine.findMany({
            where: { productId: { in: nonPcIds } },
            select: { orderId: true },
            distinct: ["orderId"],
          })
        ).map((r) => r.orderId);

        if (dirtyOrderIds.length) {
          const lineIds = (
            await tx.orderLine.findMany({
              where: { orderId: { in: dirtyOrderIds } },
              select: { id: true },
            })
          ).map((l) => l.id);

          counts.refunds = (
            await tx.refund.deleteMany({
              where: {
                OR: [
                  { orderId: { in: dirtyOrderIds } },
                  ...(lineIds.length
                    ? [{ orderLineId: { in: lineIds } }]
                    : []),
                ],
              },
            })
          ).count;

          counts.returnRequests = (
            await tx.returnRequest.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.supportTickets = (
            await tx.supportTicket.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.disputes = (
            await tx.dispute.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.protectionClaims = (
            await tx.protectionClaim.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          if (lineIds.length) {
            counts.sellerFeedback = (
              await tx.sellerFeedback.deleteMany({
                where: { orderLineId: { in: lineIds } },
              })
            ).count;
          }

          const groupIds = (
            await tx.orderFulfilmentGroup.findMany({
              where: { orderId: { in: dirtyOrderIds } },
              select: { id: true },
            })
          ).map((g) => g.id);

          if (groupIds.length) {
            counts.shipments = (
              await tx.shipment.deleteMany({
                where: { fulfilmentGroupId: { in: groupIds } },
              })
            ).count;
            counts.settlementLines = (
              await tx.settlementLine.deleteMany({
                where: { fulfilmentGroupId: { in: groupIds } },
              })
            ).count;
          }

          counts.orderLines = (
            await tx.orderLine.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.fulfilmentGroups = (
            await tx.orderFulfilmentGroup.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;

          const attemptIds = (
            await tx.paymentAttempt.findMany({
              where: { orderId: { in: dirtyOrderIds } },
              select: { id: true },
            })
          ).map((a) => a.id);
          if (attemptIds.length) {
            counts.paymentWebhooks = (
              await tx.paymentWebhookEvent.deleteMany({
                where: { paymentAttemptId: { in: attemptIds } },
              })
            ).count;
          }
          counts.paymentAttempts = (
            await tx.paymentAttempt.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.invoices = (
            await tx.invoice.deleteMany({
              where: { orderId: { in: dirtyOrderIds } },
            })
          ).count;
          counts.orders = (
            await tx.order.deleteMany({
              where: { id: { in: dirtyOrderIds } },
            })
          ).count;
        }

        counts.wishlist = (
          await tx.wishlistItem.deleteMany({
            where: { productId: { in: nonPcIds } },
          })
        ).count;
        counts.reviews = (
          await tx.productReview.deleteMany({
            where: { productId: { in: nonPcIds } },
          })
        ).count;
        counts.images = (
          await tx.productImage.deleteMany({
            where: { productId: { in: nonPcIds } },
          })
        ).count;
        counts.variants = (
          await tx.productVariant.deleteMany({
            where: { productId: { in: nonPcIds } },
          })
        ).count;
        counts.products = (
          await tx.product.deleteMany({
            where: { id: { in: nonPcIds } },
          })
        ).count;
      }

      // Catalogue v2 non-PC
      const badCatalogue = await tx.catalogueProduct.findMany({
        where: { slug: { notIn: pcProductSlugs } },
        select: { id: true },
      });
      if (badCatalogue.length) {
        const catIds = badCatalogue.map((c) => c.id);
        const catVariantIds = (
          await tx.catalogueVariant.findMany({
            where: { catalogueProductId: { in: catIds } },
            select: { id: true },
          })
        ).map((v) => v.id);
        if (catVariantIds.length) {
          const offerIds = (
            await tx.sellerOffer.findMany({
              where: { catalogueVariantId: { in: catVariantIds } },
              select: { id: true },
            })
          ).map((o) => o.id);
          if (offerIds.length) {
            counts.offerInventory = (
              await tx.offerInventory.deleteMany({
                where: { offerId: { in: offerIds } },
              })
            ).count;
            counts.sellerOffers = (
              await tx.sellerOffer.deleteMany({
                where: { id: { in: offerIds } },
              })
            ).count;
          }
          counts.catalogueVariants = (
            await tx.catalogueVariant.deleteMany({
              where: { id: { in: catVariantIds } },
            })
          ).count;
        }
        counts.catalogueImages = (
          await tx.catalogueImage.deleteMany({
            where: { catalogueProductId: { in: catIds } },
          })
        ).count;
        counts.catalogueProducts = (
          await tx.catalogueProduct.deleteMany({
            where: { id: { in: catIds } },
          })
        ).count;
      }

      counts.categories = (
        await tx.category.deleteMany({
          where: { slug: { notIn: pcCategorySlugs } },
        })
      ).count;

      counts.brands = (
        await tx.brand.deleteMany({
          where: {
            slug: { notIn: pcBrandSlugs },
            products: { none: {} },
            catalogueProducts: { none: {} },
          },
        })
      ).count;

      if (purgeSellerIds.length) {
        counts.sellerFeedbackExtra = (
          await tx.sellerFeedback.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.kycDocuments = (
          await tx.kycDocument.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.kycCases = (
          await tx.sellerKycCase.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.userRolesSeller = (
          await tx.userRole.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.protectionBySeller = (
          await tx.protectionClaim.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        // Remaining offers by purge sellers
        const leftoverOffers = await tx.sellerOffer.findMany({
          where: { sellerId: { in: purgeSellerIds } },
          select: { id: true },
        });
        if (leftoverOffers.length) {
          const ids = leftoverOffers.map((o) => o.id);
          await tx.offerInventory.deleteMany({ where: { offerId: { in: ids } } });
          counts.sellerOffersLeftover = (
            await tx.sellerOffer.deleteMany({ where: { id: { in: ids } } })
          ).count;
        }
        // Fulfilment leftovers
        counts.fulfilmentBySeller = (
          await tx.orderFulfilmentGroup.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.inventoryBySeller = (
          await tx.inventoryItem.deleteMany({
            where: { sellerId: { in: purgeSellerIds } },
          })
        ).count;
        counts.sellers = (
          await tx.seller.deleteMany({
            where: { id: { in: purgeSellerIds } },
          })
        ).count;

        const ownerIds = purgeSellers.map((s) => s.ownerUserId);
        const orphans = await tx.user.findMany({
          where: {
            id: { in: ownerIds },
            email: { endsWith: "@aspera.local" },
            NOT: { email: { in: ["admin@aspera.local", ...keepSellerEmails] } },
            ownedSellers: { none: {} },
          },
          select: { id: true, email: true },
        });
        if (orphans.length) {
          const ids = orphans.map((u) => u.id);
          await tx.session.deleteMany({ where: { userId: { in: ids } } });
          await tx.userRole.deleteMany({ where: { userId: { in: ids } } });
          await tx.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
          await tx.buyerProfile.deleteMany({ where: { userId: { in: ids } } });
          await tx.checkoutSession.deleteMany({
            where: { userId: { in: ids } },
          });
          await tx.customerAddress.deleteMany({
            where: { userId: { in: ids } },
          });
          const cartIds = (
            await tx.cart.findMany({
              where: { userId: { in: ids } },
              select: { id: true },
            })
          ).map((c) => c.id);
          if (cartIds.length) {
            await tx.cartItem.deleteMany({
              where: { cartId: { in: cartIds } },
            });
            await tx.cart.deleteMany({ where: { id: { in: cartIds } } });
          }
          await tx.paymentAttempt.deleteMany({
            where: { userId: { in: ids } },
          });
          await tx.productReview.deleteMany({ where: { userId: { in: ids } } });
          await tx.sellerFeedback.deleteMany({
            where: { userId: { in: ids } },
          });
          await tx.protectionClaim.deleteMany({
            where: { userId: { in: ids } },
          });
          await tx.supportTicket.deleteMany({
            where: { userId: { in: ids } },
          });
          await tx.dispute.deleteMany({ where: { userId: { in: ids } } });
          const userOrderIds = (
            await tx.order.findMany({
              where: { userId: { in: ids } },
              select: { id: true },
            })
          ).map((o) => o.id);
          if (userOrderIds.length) {
            await tx.refund.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.returnRequest.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.invoice.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.orderLine.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.orderFulfilmentGroup.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.paymentAttempt.deleteMany({
              where: { orderId: { in: userOrderIds } },
            });
            await tx.order.deleteMany({ where: { id: { in: userOrderIds } } });
          }
          try {
            counts.orphanUsers = (
              await tx.user.deleteMany({ where: { id: { in: ids } } })
            ).count;
            console.log(
              "deletedOrphanUsers",
              orphans.map((u) => u.email),
            );
          } catch (error) {
            console.warn(
              "orphan user delete skipped (FK remains)",
              orphans.map((u) => u.email),
              error instanceof Error ? error.message : error,
            );
            counts.orphanUsersSkipped = orphans.length;
          }
        }
      }

      await tx.category.updateMany({
        where: { slug: { in: pcCategorySlugs } },
        data: { isActive: true },
      });
    },
    { timeout: 180_000 },
  );

  const remaining = {
    products: await prisma.product.count(),
    approved: await prisma.product.count({ where: { status: "approved" } }),
    nonPcLeft: await prisma.product.count({
      where: { slug: { notIn: pcProductSlugs } },
    }),
    categories: await prisma.category.findMany({
      select: {
        slug: true,
        isActive: true,
        _count: { select: { products: true } },
      },
      orderBy: { slug: "asc" },
    }),
    sellers: await prisma.seller.findMany({
      select: {
        tradeName: true,
        contactEmail: true,
        _count: { select: { products: true } },
      },
    }),
    brands: await prisma.brand.count(),
  };

  console.log(JSON.stringify({ deleted: counts, remaining }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
