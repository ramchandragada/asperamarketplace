import { afterAll, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
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
import { addCartItem, confirmCheckout, createAddress, previewCheckout } from "@/modules/cart/service";
import { STUDIO_LOOM_PRODUCTS } from "@/modules/catalogue/studio-loom-catalogue";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("studio loom seller catalogue", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "studio-loom-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("approves one seller with ten purchasable listings", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const sellerSession = await registerUser(
      {
        email: `studio-loom-${suffix}@aspera.local`,
        password: "AsperaStudioDevOnly1!",
        displayName: "Studio Loom",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminSession = await registerUser(
      {
        email: `studio-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Studio Admin",
        intent: "customer",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { key: "admin" } });
    await prisma.userRole.create({
      data: {
        userId: adminSession.userId,
        roleId: adminRole.id,
        scopeKey: "global",
      },
    });

    const sellerActor: Actor = {
      userId: sellerSession.userId,
      email: `studio-loom-${suffix}@aspera.local`,
      displayName: "Studio Loom",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `studio-admin-${suffix}@aspera.local`,
      displayName: "Studio Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerDraft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Studio Loom Traders Private Limited",
        tradeName: "Studio Loom",
        contactEmail: `studio-ops-${suffix}@aspera.local`,
        contactPhone: "9845012340",
        pan: "STUDB1234F",
        gstin: "29STUDB1234F1Z5",
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
      bytes: Buffer.from("%PDF-1.4 studio-loom-kyc"),
      correlationId: crypto.randomUUID(),
    });
    const submittedSeller = await submitSellerForReview(
      sellerActor,
      { sellerId: sellerDraft.id, acceptAgreement: true },
      crypto.randomUUID(),
    );
    const approvedSeller = await reviewSeller(
      adminActor,
      {
        sellerId: sellerDraft.id,
        decision: "approve",
        reason: "Studio Loom development approval",
        expectedVersion: submittedSeller.version,
      },
      crypto.randomUUID(),
    );
    expect(approvedSeller.status).toBe("approved");

    const created = [];
    for (const item of STUDIO_LOOM_PRODUCTS) {
      const draft = await createProductDraft(
        sellerActor,
        {
          sellerId: sellerDraft.id,
          categoryId: category.id,
          brandName: "Studio Loom",
          title: `${item.title} ${suffix}`,
          summary: item.summary,
          description: item.description,
          countryOfOrigin: "India",
          hsnCode: item.hsnCode,
          imageUrl: item.imageUrl,
          variant: {
            sku: `${item.sku}-${suffix.toUpperCase()}`,
            title: item.variantTitle,
            mrpPaise: item.mrpPaise,
            sellingPricePaise: item.sellingPricePaise,
            initialStock: item.initialStock,
            weightGrams: item.weightGrams,
          },
        },
        crypto.randomUUID(),
      );
      const submitted = await submitProductForReview(
        sellerActor,
        { productId: draft.product.id },
        crypto.randomUUID(),
      );
      const approved = await reviewProduct(
        adminActor,
        {
          productId: draft.product.id,
          decision: "approve",
          reason: "Studio Loom catalogue review accepted",
          expectedVersion: submitted.version,
        },
        crypto.randomUUID(),
      );
      expect(approved.status).toBe("approved");
      created.push(draft);
    }

    expect(created).toHaveLength(10);
    const owned = await prisma.product.count({
      where: { sellerId: sellerDraft.id, status: "approved" },
    });
    expect(owned).toBe(10);

    const search = await searchApprovedProducts({
      q: `Studio Loom ${suffix}`,
      page: 1,
      pageSize: 24,
    });
    expect(search.items).toHaveLength(10);
    expect(search.items.every((item) => item.primaryImageUrl?.includes("images.unsplash.com"))).toBe(
      true,
    );

    const first = created[0];
    if (!first) throw new Error("Expected a created product");
    const publicProduct = await getPublicProductBySlug(first.product.slug);
    expect(publicProduct?.images[0]?.url).toBe(STUDIO_LOOM_PRODUCTS[0]?.imageUrl);
    expect(publicProduct?.seller.tradeName).toBe("Studio Loom");

    const cart = await addCartItem(
      sellerActor,
      { variantId: first.variant.id, quantity: 1 },
      crypto.randomUUID(),
    );
    const address = await createAddress(
      sellerActor,
      {
        label: "Home",
        fullName: "Studio Loom",
        phone: "9845012340",
        line1: "12 Residency Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560025",
        country: "IN",
        isDefault: true,
      },
      crypto.randomUUID(),
    );
    const preview = await previewCheckout(sellerActor, { addressId: address.id });
    expect(preview.snapshot.lines).toHaveLength(1);
    expect(preview.snapshot.lines[0]?.sku).toContain("SLM-STOLE-01");
    expect(preview.snapshot.subtotalPaise).toBe(STUDIO_LOOM_PRODUCTS[0]?.sellingPricePaise);
    expect(preview.snapshot.totalPaise).toBe(
      preview.snapshot.subtotalPaise +
        preview.snapshot.shippingPaise +
        preview.snapshot.taxPaise -
        preview.snapshot.discountPaise,
    );

    const reserved = await confirmCheckout(
      sellerActor,
      {
        addressId: address.id,
        expectedCartVersion: cart.version,
        idempotencyKey: `studio-loom-${suffix}`,
      },
      crypto.randomUUID(),
    );
    expect(reserved.checkout.status).toBe("reserved");
    const inventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: first.variant.id },
    });
    expect(inventory.reserved).toBe(1);
    expect(inventory.onHand).toBe(STUDIO_LOOM_PRODUCTS[0]?.initialStock);
  });
});
