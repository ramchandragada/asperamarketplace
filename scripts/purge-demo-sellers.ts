/**
 * Go-live cleanup: delete every seller except:
 *   - VSCG Distribution (the real dealer)
 *   - Aspera Catalogue (platform closed-catalogue owner — not a shop)
 *
 * Usage:
 *   DATABASE_URL=... pnpm exec tsx scripts/purge-demo-sellers.ts --dry-run
 *   DATABASE_URL=... pnpm exec tsx scripts/purge-demo-sellers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const KEEP_TRADE_NAMES = new Set([
  "VSCG Distribution",
  "Aspera Catalogue",
]);

async function main() {
  const sellers = await prisma.seller.findMany({
    select: {
      id: true,
      tradeName: true,
      legalName: true,
      status: true,
      gstin: true,
      contactEmail: true,
      ownerUserId: true,
      owner: { select: { email: true } },
      _count: { select: { products: true } },
    },
    orderBy: { tradeName: "asc" },
  });

  const keep = sellers.filter((s) =>
    KEEP_TRADE_NAMES.has(s.tradeName ?? "") ||
    /vscg/i.test(`${s.tradeName} ${s.legalName}`),
  );
  const keepIds = new Set(keep.map((s) => s.id));
  // Always keep exact catalogue + any VSCG match; drop the rest.
  const purge = sellers.filter((s) => !keepIds.has(s.id));
  // If multiple VSCG-like rows somehow exist, keep the gstin one preferentially.
  const vscgKeep = keep.filter((s) => /vscg/i.test(`${s.tradeName} ${s.legalName}`));
  const catalogueKeep = keep.filter((s) => s.tradeName === "Aspera Catalogue");

  console.log(
    JSON.stringify(
      {
        dryRun,
        keep: keep.map((s) => ({
          tradeName: s.tradeName,
          gstin: s.gstin,
          products: s._count.products,
          status: s.status,
        })),
        purge: purge.map((s) => ({
          tradeName: s.tradeName,
          email: s.contactEmail,
          products: s._count.products,
          status: s.status,
        })),
        vscgCount: vscgKeep.length,
        catalogueCount: catalogueKeep.length,
      },
      null,
      2,
    ),
  );

  if (vscgKeep.length < 1) {
    throw new Error("Abort: VSCG Distribution not found — refusing to purge");
  }
  if (catalogueKeep.length < 1) {
    throw new Error("Abort: Aspera Catalogue not found — closed catalogue would break");
  }
  if (dryRun) {
    console.log("Dry run — no writes");
    return;
  }

  const purgeIds = purge.map((s) => s.id);
  const counts: Record<string, number> = {};

  await prisma.$transaction(
    async (tx) => {
      if (purgeIds.length === 0) return;

      const productIds = (
        await tx.product.findMany({
          where: { sellerId: { in: purgeIds } },
          select: { id: true },
        })
      ).map((p) => p.id);

      const dirtyOrderIdSet = new Set<string>();
      if (productIds.length) {
        for (const row of await tx.orderLine.findMany({
          where: { productId: { in: productIds } },
          select: { orderId: true },
          distinct: ["orderId"],
        })) {
          dirtyOrderIdSet.add(row.orderId);
        }
      }
      for (const row of await tx.orderLine.findMany({
        where: { sellerId: { in: purgeIds } },
        select: { orderId: true },
        distinct: ["orderId"],
      })) {
        dirtyOrderIdSet.add(row.orderId);
      }
      for (const row of await tx.orderFulfilmentGroup.findMany({
        where: { sellerId: { in: purgeIds } },
        select: { orderId: true },
        distinct: ["orderId"],
      })) {
        dirtyOrderIdSet.add(row.orderId);
      }
      for (const row of await tx.tcsCollectionLine.findMany({
        where: { sellerId: { in: purgeIds } },
        select: { orderId: true },
        distinct: ["orderId"],
      })) {
        dirtyOrderIdSet.add(row.orderId);
      }

      const dirtyOrderIds = [...dirtyOrderIdSet];
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
                ...(lineIds.length ? [{ orderLineId: { in: lineIds } }] : []),
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
            where: {
              OR: [
                { orderId: { in: dirtyOrderIds } },
                { sellerId: { in: purgeIds } },
              ],
            },
          })
        ).count;
        if (lineIds.length) {
          counts.sellerFeedbackLines = (
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
        counts.tcsCollectionLines = (
          await tx.tcsCollectionLine.deleteMany({
            where: { orderId: { in: dirtyOrderIds } },
          })
        ).count;
        counts.settlementLinesByOrder = (
          await tx.settlementLine.deleteMany({
            where: { orderId: { in: dirtyOrderIds } },
          })
        ).count;
        counts.orders = (
          await tx.order.deleteMany({
            where: { id: { in: dirtyOrderIds } },
          })
        ).count;
      }

      if (productIds.length) {
        const variantIds = (
          await tx.productVariant.findMany({
            where: { productId: { in: productIds } },
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

        counts.wishlist = (
          await tx.wishlistItem.deleteMany({
            where: { productId: { in: productIds } },
          })
        ).count;
        counts.reviews = (
          await tx.productReview.deleteMany({
            where: { productId: { in: productIds } },
          })
        ).count;
        counts.images = (
          await tx.productImage.deleteMany({
            where: { productId: { in: productIds } },
          })
        ).count;

        if (variantIds.length) {
          counts.variants = (
            await tx.productVariant.deleteMany({
              where: { id: { in: variantIds } },
            })
          ).count;
        }
        counts.products = (
          await tx.product.deleteMany({
            where: { id: { in: productIds } },
          })
        ).count;
      }

      // Seller-scoped leftovers
      counts.sellerFeedback = (
        await tx.sellerFeedback.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.kycDocuments = (
        await tx.kycDocument.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.kycCases = (
        await tx.sellerKycCase.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.userRolesSeller = (
        await tx.userRole.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.protectionBySeller = (
        await tx.protectionClaim.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.tcsBySeller = (
        await tx.tcsCollectionLine.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;

      const leftoverOffers = await tx.sellerOffer.findMany({
        where: { sellerId: { in: purgeIds } },
        select: { id: true },
      });
      if (leftoverOffers.length) {
        const ids = leftoverOffers.map((o) => o.id);
        await tx.offerInventory.deleteMany({ where: { offerId: { in: ids } } });
        counts.sellerOffers = (
          await tx.sellerOffer.deleteMany({ where: { id: { in: ids } } })
        ).count;
      }

      counts.fulfilmentBySeller = (
        await tx.orderFulfilmentGroup.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;
      counts.inventoryBySeller = (
        await tx.inventoryItem.deleteMany({
          where: { sellerId: { in: purgeIds } },
        })
      ).count;

      const ownerIds = purge.map((s) => s.ownerUserId);

      counts.sellers = (
        await tx.seller.deleteMany({
          where: { id: { in: purgeIds } },
        })
      ).count;

      // Demo users (@aspera.local) that no longer own a seller
      const orphans = await tx.user.findMany({
        where: {
          id: { in: ownerIds },
          email: { endsWith: "@aspera.local" },
          ownedSellers: { none: {} },
        },
        select: { id: true },
      });
      if (orphans.length) {
        const ids = orphans.map((u) => u.id);
        await tx.session.deleteMany({ where: { userId: { in: ids } } });
        await tx.userRole.deleteMany({ where: { userId: { in: ids } } });
        await tx.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
        await tx.buyerProfile.deleteMany({ where: { userId: { in: ids } } });
        await tx.checkoutSession.deleteMany({ where: { userId: { in: ids } } });
        await tx.customerAddress.deleteMany({ where: { userId: { in: ids } } });
        const cartIds = (
          await tx.cart.findMany({
            where: { userId: { in: ids } },
            select: { id: true },
          })
        ).map((c) => c.id);
        if (cartIds.length) {
          await tx.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
          await tx.cart.deleteMany({ where: { id: { in: cartIds } } });
        }
        counts.demoUsers = (
          await tx.user.deleteMany({ where: { id: { in: ids } } })
        ).count;
      }
    },
    { timeout: 180_000 },
  );

  const remaining = await prisma.seller.findMany({
    select: {
      tradeName: true,
      status: true,
      gstin: true,
      _count: { select: { products: true } },
    },
    orderBy: { tradeName: "asc" },
  });
  console.log(JSON.stringify({ ok: true, counts, remaining }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
