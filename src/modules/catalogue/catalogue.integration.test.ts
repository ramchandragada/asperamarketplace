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
  ensureGenericCategory,
  getPublicProductBySlug,
  reviewProduct,
  searchApprovedProducts,
  submitProductForReview,
} from "@/modules/catalogue/service";
import { rm } from "node:fs/promises";
import path from "node:path";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("catalogue discovery integration", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "catalogue-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("creates, submits, approves, and discovers a listing publicly", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();

    const suffix = crypto.randomUUID().slice(0, 8);
    const sellerSession = await registerUser(
      {
        email: `cat-seller-${suffix}@aspera.local`,
        password: "AsperaSellerDevOnly1!",
        displayName: "Catalogue Seller",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminSession = await registerUser(
      {
        email: `cat-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Catalogue Admin",
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

    const sellerActor: Actor = {
      userId: sellerSession.userId,
      email: `cat-seller-${suffix}@aspera.local`,
      displayName: "Catalogue Seller",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `cat-admin-${suffix}@aspera.local`,
      displayName: "Catalogue Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerDraft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Catalogue Traders Private Limited",
        tradeName: "Catalogue Mart",
        contactEmail: `cat-ops-${suffix}@aspera.local`,
        contactPhone: "9876543210",
        pan: "ABCDE1234F",
        gstin: "29ABCDE1234F1Z5",
        registeredState: "Karnataka",
      },
      crypto.randomUUID(),
    );

    await uploadSellerDocument({
      actor: sellerActor,
      sellerId: sellerDraft.id,
      documentType: "business_registration",
      fileName: "registration.pdf",
      contentType: "application/pdf",
      bytes: Buffer.from("%PDF-1.4 fictional-kyc-document"),
      correlationId: crypto.randomUUID(),
    });

    const sellerSubmitted = await submitSellerForReview(
      sellerActor,
      { sellerId: sellerDraft.id, acceptAgreement: true },
      crypto.randomUUID(),
    );
    await reviewSeller(
      adminActor,
      {
        sellerId: sellerDraft.id,
        decision: "approve",
        reason: "Development seller approval",
        expectedVersion: sellerSubmitted.version,
      },
      crypto.randomUUID(),
    );

    const sku = `CAT-${suffix.toUpperCase()}`;
    const created = await createProductDraft(
      sellerActor,
      {
        sellerId: sellerDraft.id,
        categoryId: category.id,
        brandName: "Catalogue Brand",
        title: "Stainless steel bottle",
        summary: "Reusable water bottle for daily commute and travel.",
        description:
          "Fictional integration listing with leak-resistant cap and 750 ml capacity for local discovery tests.",
        countryOfOrigin: "India",
        hsnCode: "7323",
        variant: {
          sku,
          title: "750 ml",
          mrpPaise: 89900,
          sellingPricePaise: 69900,
          initialStock: 12,
          weightGrams: 320,
        },
      },
      crypto.randomUUID(),
    );

    expect(created.product.status).toBe("draft");
    expect(created.inventory.onHand).toBe(12);

    const submitted = await submitProductForReview(
      sellerActor,
      { productId: created.product.id },
      crypto.randomUUID(),
    );
    expect(submitted.status).toBe("submitted");

    const approved = await reviewProduct(
      adminActor,
      {
        productId: created.product.id,
        decision: "approve",
        reason: "Development catalogue review accepted",
        expectedVersion: submitted.version,
      },
      crypto.randomUUID(),
    );
    expect(approved.status).toBe("approved");

    const publicProduct = await getPublicProductBySlug(created.product.slug);
    expect(publicProduct?.title).toBe("Stainless steel bottle");
    expect(publicProduct?.variants[0]?.sellingPricePaise).toBe(69900);

    const search = await searchApprovedProducts({
      q: "stainless",
      page: 1,
      pageSize: 12,
    });
    expect(search.items.some((item) => item.id === created.product.id)).toBe(
      true,
    );

    const audit = await prisma.auditLog.findFirst({
      where: { targetId: created.product.id, action: "product.approved" },
    });
    const outbox = await prisma.outboxEvent.findFirst({
      where: {
        aggregateId: created.product.id,
        eventType: "ProductApproved",
      },
    });
    expect(audit).not.toBeNull();
    expect(outbox).not.toBeNull();
  });
});
