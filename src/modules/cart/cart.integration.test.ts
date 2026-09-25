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
  reviewProduct,
  submitProductForReview,
} from "@/modules/catalogue/service";
import {
  addCartItem,
  confirmCheckout,
  createAddress,
  getCartForActor,
  previewCheckout,
} from "@/modules/cart/service";
import { TotalsMismatchError } from "@/modules/cart/pricing";
import { rm } from "node:fs/promises";
import path from "node:path";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("cart checkout integration", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "cart-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("adds a line, rejects bad client totals, and reserves stock idempotently", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const sellerSession = await registerUser(
      {
        email: `cart-seller-${suffix}@aspera.local`,
        password: "AsperaSellerDevOnly1!",
        displayName: "Cart Seller",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );
    const buyerSession = await registerUser(
      {
        email: `cart-buyer-${suffix}@aspera.local`,
        password: "AsperaBuyerDevOnly1!",
        displayName: "Cart Buyer",
        intent: "customer",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminSession = await registerUser(
      {
        email: `cart-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Cart Admin",
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
      email: `cart-seller-${suffix}@aspera.local`,
      displayName: "Cart Seller",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const buyerActor: Actor = {
      userId: buyerSession.userId,
      email: `cart-buyer-${suffix}@aspera.local`,
      displayName: "Cart Buyer",
      roles: [{ key: "customer", sellerId: null }],
      sessionId: buyerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `cart-admin-${suffix}@aspera.local`,
      displayName: "Cart Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerDraft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Cart Traders Private Limited",
        tradeName: "Cart Mart",
        contactEmail: `cart-ops-${suffix}@aspera.local`,
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
        reason: "Development approval",
        expectedVersion: sellerSubmitted.version,
      },
      crypto.randomUUID(),
    );

    const created = await createProductDraft(
      sellerActor,
      {
        sellerId: sellerDraft.id,
        categoryId: category.id,
        title: "Cart test mug",
        summary: "Ceramic mug for checkout reservation tests.",
        description:
          "Fictional integration listing used to validate cart reservation and server totals.",
        countryOfOrigin: "India",
        variant: {
          sku: `MUG-${suffix.toUpperCase()}`,
          title: "Default",
          mrpPaise: 59900,
          sellingPricePaise: 49900,
          initialStock: 10,
          weightGrams: 350,
        },
      },
      crypto.randomUUID(),
    );
    const submitted = await submitProductForReview(
      sellerActor,
      { productId: created.product.id },
      crypto.randomUUID(),
    );
    await reviewProduct(
      adminActor,
      {
        productId: created.product.id,
        decision: "approve",
        reason: "Development catalogue approval",
        expectedVersion: submitted.version,
      },
      crypto.randomUUID(),
    );

    const cart = await addCartItem(
      buyerActor,
      { variantId: created.variant.id, quantity: 2 },
      crypto.randomUUID(),
    );
    expect(cart.items).toHaveLength(1);
    expect(cart.merchandisePaise).toBe(99800);

    const address = await createAddress(
      buyerActor,
      {
        label: "Home",
        fullName: "Cart Buyer",
        phone: "9876543210",
        line1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "IN",
        isDefault: true,
      },
      crypto.randomUUID(),
    );

    const preview = await previewCheckout(buyerActor, {
      addressId: address.id,
      couponCode: "ASPERA10",
    });
    expect(preview.snapshot.discountPaise).toBeGreaterThan(0);

    await expect(
      previewCheckout(buyerActor, {
        addressId: address.id,
        couponCode: "ASPERA10",
        clientTotalPaise: preview.snapshot.totalPaise + 1,
      }),
    ).rejects.toBeInstanceOf(TotalsMismatchError);

    const beforeInventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: created.variant.id },
    });

    const idempotencyKey = `cart-test-${suffix}`;
    const confirmed = await confirmCheckout(
      buyerActor,
      {
        addressId: address.id,
        couponCode: "ASPERA10",
        clientTotalPaise: preview.snapshot.totalPaise,
        expectedCartVersion: preview.cart.version,
        idempotencyKey,
      },
      crypto.randomUUID(),
    );
    expect(confirmed.checkout.status).toBe("reserved");
    expect(confirmed.checkout.totalPaise).toBe(preview.snapshot.totalPaise);

    const afterInventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: created.variant.id },
    });
    expect(afterInventory.reserved).toBe(beforeInventory.reserved + 2);

    const replay = await confirmCheckout(
      buyerActor,
      {
        addressId: address.id,
        couponCode: "ASPERA10",
        clientTotalPaise: preview.snapshot.totalPaise,
        expectedCartVersion: preview.cart.version,
        idempotencyKey,
      },
      crypto.randomUUID(),
    );
    expect(replay.checkout.id).toBe(confirmed.checkout.id);

    const afterReplay = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: created.variant.id },
    });
    expect(afterReplay.reserved).toBe(afterInventory.reserved);

    const emptyCart = await getCartForActor(buyerActor);
    expect(emptyCart.items).toHaveLength(0);
    expect(emptyCart.status).toBe("open");

    const audit = await prisma.auditLog.findFirst({
      where: {
        targetId: confirmed.checkout.id,
        action: "checkout.reserved",
      },
    });
    const outbox = await prisma.outboxEvent.findFirst({
      where: {
        aggregateId: confirmed.checkout.id,
        eventType: "CheckoutReserved",
      },
    });
    expect(audit).not.toBeNull();
    expect(outbox).not.toBeNull();
  });
});
