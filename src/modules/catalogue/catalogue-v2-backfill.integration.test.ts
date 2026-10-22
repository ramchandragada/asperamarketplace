import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/platform/db/prisma";
import { backfillCatalogueV2 } from "@/modules/catalogue/catalogue-v2-backfill";
import {
  bestOfferPricePaise,
  getCatalogueProductBySlug,
} from "@/modules/catalogue/catalogue-v2";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("catalogue v2 backfill", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("maps a shared-listing group into one catalogue product with offers", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const sharedKey = `backfill-${suffix}`;

    const category = await prisma.category.create({
      data: { slug: `cat-${suffix}`, name: `Cat ${suffix}` },
    });

    async function makeSeller(tag: string) {
      const owner = await prisma.user.create({
        data: {
          email: `bf-${tag}-${suffix}@aspera.local`,
          displayName: `Backfill Owner ${tag}`,
          status: "active",
          passwordHash: "x",
        },
      });
      return prisma.seller.create({
        data: {
          ownerUserId: owner.id,
          legalName: `Backfill Traders ${tag} ${suffix}`,
          tradeName: `Backfill ${tag} ${suffix}`,
          status: "approved",
          contactEmail: `bf-ops-${tag}-${suffix}@aspera.local`,
        },
      });
    }

    // Two sellers list the same product under one shared listing key, at
    // different prices/stock (one seller, one listing per shared key).
    async function makeProduct(
      sellerId: string,
      priceP: number,
      stock: number,
      tag: string,
    ) {
      const product = await prisma.product.create({
        data: {
          sellerId,
          categoryId: category.id,
          slug: `bf-${tag}-${suffix}`,
          title: "Backfill kettle",
          summary: "A 1.5L electric kettle.",
          description: "Stainless electric kettle with auto cut-off.",
          status: "approved",
          sharedListingKey: sharedKey,
          publishedAt: new Date(),
        },
      });
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: `BF-${tag}-${suffix}`,
          title: "1.5 litre",
          mrpPaise: 149900,
          sellingPricePaise: priceP,
        },
      });
      await prisma.inventoryItem.create({
        data: { variantId: variant.id, sellerId, onHand: stock },
      });
      return product;
    }
    const sellerA = await makeSeller("a");
    const sellerB = await makeSeller("b");
    const first = await makeProduct(sellerA.id, 129900, 7, "a");
    await makeProduct(sellerB.id, 119900, 4, "b");

    const result = await backfillCatalogueV2();
    expect(result.created.offers).toBeGreaterThanOrEqual(2);

    // The group collapsed onto the canonical (oldest) product's slug.
    const view = await getCatalogueProductBySlug(first.slug);
    expect(view).not.toBeNull();
    expect(view!.title).toBe("Backfill kettle");
    const offers = view!.variants[0]?.offers ?? [];
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(await bestOfferPricePaise(view!.id)).toBe(119900);

    // Idempotent: a second run creates nothing new for this group.
    const second = await backfillCatalogueV2();
    const again = await getCatalogueProductBySlug(first.slug);
    const offersAgain = again!.variants[0]?.offers ?? [];
    expect(offersAgain.length).toBe(offers.length);
    expect(second.skipped).toBeGreaterThanOrEqual(1);
  });
});
