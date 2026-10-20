import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/platform/db/prisma";
import { ensureSystemRoles, registerUser } from "@/modules/identity/service";
import type { Actor } from "@/modules/identity/policy";
import {
  createSellerDraft,
  reviewSeller,
  submitSellerForReview,
  uploadSellerDocument,
} from "@/modules/seller/service";
import {
  createProductDraft,
  createProductOffer,
  ensureGenericCategory,
  getPublicProductBySlug,
  listSiblingSellerOffers,
  reviewProduct,
  submitProductForReview,
} from "@/modules/catalogue/service";
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

describe.runIf(hasDatabase)("multi-seller same product", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "multi-seller-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("lets a second seller list an approved product and shows sibling offers", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const adminSession = await registerUser(
      {
        email: `ms-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Multi Seller Admin",
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
      email: `ms-admin-${suffix}@aspera.local`,
      displayName: "Multi Seller Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const primary = await approveSeller("ms-primary", suffix, adminActor);
    const secondary = await approveSeller("ms-second", suffix, adminActor);

    const created = await createProductDraft(
      primary.actor,
      {
        sellerId: primary.sellerId,
        categoryId: category.id,
        brandName: "Shared Goods",
        title: "Ceramic mug set",
        summary: "Set of four stackable ceramic mugs for tea and coffee.",
        description:
          "Stackable ceramic mugs with a smooth glaze for everyday tea and coffee. Microwave-safe and dishwasher-safe for busy kitchens.",
        countryOfOrigin: "India",
        hsnCode: "6912",
        variant: {
          sku: `MUG-${suffix.toUpperCase()}`,
          title: "Set of 4",
          mrpPaise: 99900,
          sellingPricePaise: 79900,
          initialStock: 20,
          weightGrams: 900,
        },
      },
      crypto.randomUUID(),
    );
    const submitted = await submitProductForReview(
      primary.actor,
      { productId: created.product.id },
      crypto.randomUUID(),
    );
    await reviewProduct(
      adminActor,
      {
        productId: created.product.id,
        decision: "approve",
        reason: "Approved for multi-seller fixture",
        expectedVersion: submitted.version,
      },
      crypto.randomUUID(),
    );

    const offer = await createProductOffer(
      secondary.actor,
      {
        sellerId: secondary.sellerId,
        sourceProductId: created.product.id,
        variant: {
          sku: `MUG-${suffix.toUpperCase()}-B`,
          title: "Set of 4",
          mrpPaise: 99900,
          sellingPricePaise: 74900,
          initialStock: 8,
        },
      },
      crypto.randomUUID(),
    );
    expect(offer.sharedListingKey).toBeTruthy();
    expect(offer.product.status).toBe("draft");

    const offerSubmitted = await submitProductForReview(
      secondary.actor,
      { productId: offer.product.id },
      crypto.randomUUID(),
    );
    await reviewProduct(
      adminActor,
      {
        productId: offer.product.id,
        decision: "approve",
        reason: "Approved sibling offer",
        expectedVersion: offerSubmitted.version,
      },
      crypto.randomUUID(),
    );

    const siblings = await listSiblingSellerOffers(created.product.id);
    expect(siblings).toHaveLength(2);
    expect(siblings.some((row) => row.isCurrent)).toBe(true);
    expect(siblings.some((row) => row.sellingPricePaise === 74900)).toBe(true);

    const publicPrimary = await getPublicProductBySlug(created.product.slug);
    expect(publicPrimary?.sharedListingKey).toBe(offer.sharedListingKey);
    const publicOffer = await getPublicProductBySlug(offer.product.slug);
    expect(publicOffer?.title).toBe("Ceramic mug set");
  });
});
