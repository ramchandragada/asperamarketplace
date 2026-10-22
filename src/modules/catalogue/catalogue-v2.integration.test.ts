import { afterAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { prisma } from "@/platform/db/prisma";
import { ensureSystemRoles, registerUser } from "@/modules/identity/service";
import type { Actor } from "@/modules/identity/policy";
import {
  createSellerDraft,
  reviewSeller,
  submitSellerForReview,
  uploadSellerDocument,
} from "@/modules/seller/service";
import { ensureGenericCategory } from "@/modules/catalogue/service";
import {
  addCatalogueVariant,
  bestOfferPricePaise,
  createCatalogueProduct,
  createSellerOffer,
  getCatalogueProductBySlug,
  publishCatalogueProduct,
} from "@/modules/catalogue/catalogue-v2";
import { rm } from "node:fs/promises";
import path from "node:path";

const hasDatabase = Boolean(process.env.DATABASE_URL);

async function approveSeller(label: string, suffix: string, adminActor: Actor) {
  const session = await registerUser(
    {
      email: `${label}-${suffix}@aspera.local`,
      password: "AsperaSellerDevOnly1!",
      displayName: `${label} Seller`,
      intent: "seller",
    },
    { correlationId: crypto.randomUUID() },
  );
  const actor: Actor = {
    userId: session.userId,
    email: `${label}-${suffix}@aspera.local`,
    displayName: `${label} Seller`,
    roles: [{ key: "seller_owner", sellerId: null }],
    sessionId: session.sessionId,
  };
  const draft = await createSellerDraft(
    actor,
    {
      legalName: `${label} Traders Private Limited`,
      tradeName: `${label} Mart`,
      contactEmail: `${label}-ops-${suffix}@aspera.local`,
      contactPhone: "9876543210",
      pan: "ABCDE1234F",
      gstin: "29ABCDE1234F1Z5",
      registeredState: "Karnataka",
    },
    crypto.randomUUID(),
  );
  await uploadSellerDocument({
    actor,
    sellerId: draft.id,
    documentType: "business_registration",
    fileName: "registration.pdf",
    contentType: "application/pdf",
    bytes: Buffer.from("%PDF-1.4 fictional-kyc-document"),
    correlationId: crypto.randomUUID(),
  });
  const submitted = await submitSellerForReview(
    actor,
    { sellerId: draft.id, acceptAgreement: true },
    crypto.randomUUID(),
  );
  await reviewSeller(
    adminActor,
    {
      sellerId: draft.id,
      decision: "approve",
      reason: "Development seller approval",
      expectedVersion: submitted.version,
    },
    crypto.randomUUID(),
  );
  return { actor, sellerId: draft.id };
}

describe.runIf(hasDatabase)("catalogue v2 — shared catalogue + offers", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "catalogue-v2-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("shows one product with two sellers' offers, featuring the cheapest in stock", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const adminSession = await registerUser(
      {
        email: `cv2-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Catalogue V2 Admin",
        intent: "customer",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { key: "admin" },
    });
    await prisma.userRole.create({
      data: {
        userId: adminSession.userId,
        roleId: adminRole.id,
        scopeKey: "global",
      },
    });
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `cv2-admin-${suffix}@aspera.local`,
      displayName: "Catalogue V2 Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerA = await approveSeller("cv2-a", suffix, adminActor);
    const sellerB = await approveSeller("cv2-b", suffix, adminActor);

    // Marketplace-owned catalogue product + one shared variant.
    const product = await createCatalogueProduct({
      categoryId: category.id,
      title: `Steel water bottle ${suffix}`,
      summary: "Insulated 1L steel bottle.",
      description: "Double-walled insulated steel bottle that keeps drinks cold.",
      hsnCode: "9617",
    });
    const variant = await addCatalogueVariant({
      catalogueProductId: product.id,
      title: "1 litre",
      mrpPaise: 99900,
    });
    await publishCatalogueProduct(product.id);

    // Two sellers attach offers to the SAME variant at different prices/stock.
    await createSellerOffer({
      sellerId: sellerA.sellerId,
      catalogueVariantId: variant.id,
      sku: `BOTL-A-${suffix}`,
      sellingPricePaise: 79900,
      mrpPaise: 99900,
      initialStock: 10,
      status: "approved",
    });
    await createSellerOffer({
      sellerId: sellerB.sellerId,
      catalogueVariantId: variant.id,
      sku: `BOTL-B-${suffix}`,
      sellingPricePaise: 74900,
      mrpPaise: 99900,
      initialStock: 5,
      status: "approved",
    });

    const view = await getCatalogueProductBySlug(product.slug);
    expect(view).not.toBeNull();
    expect(view!.variants).toHaveLength(1);
    const offers = view!.variants[0]?.offers ?? [];
    expect(offers).toHaveLength(2);
    // Cheaper in-stock seller B is featured and sorted first.
    expect(offers[0]?.sellerId).toBe(sellerB.sellerId);
    expect(offers[0]?.sellingPricePaise).toBe(74900);
    expect(offers.find((o) => o.isFeatured)?.sellerId).toBe(sellerB.sellerId);

    expect(await bestOfferPricePaise(product.id)).toBe(74900);

    // A seller's price change must not touch the other seller's offer.
    await prisma.sellerOffer.updateMany({
      where: { sku: `BOTL-B-${suffix}` },
      data: { sellingPricePaise: 84900 },
    });
    const after = await getCatalogueProductBySlug(product.slug);
    const afterOffers = after!.variants[0]?.offers ?? [];
    const sellerAOffer = afterOffers.find(
      (o) => o.sellerId === sellerA.sellerId,
    );
    expect(sellerAOffer?.sellingPricePaise).toBe(79900);
    // Now seller A is the cheapest → becomes the featured winner.
    expect(afterOffers.find((o) => o.isFeatured)?.sellerId).toBe(
      sellerA.sellerId,
    );
  });
});
