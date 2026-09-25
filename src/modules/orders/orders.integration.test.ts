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
  previewCheckout,
} from "@/modules/cart/service";
import {
  createOrderFromCheckout,
  processPaymentWebhook,
  startPayment,
} from "@/modules/orders/service";
import { MockPaymentProvider } from "@/modules/payments/provider";
import { rm } from "node:fs/promises";
import path from "node:path";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("orders and mock payments integration", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "orders-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("creates an order, pays via signed webhook, rejects replay", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const sellerSession = await registerUser(
      {
        email: `pay-seller-${suffix}@aspera.local`,
        password: "AsperaSellerDevOnly1!",
        displayName: "Pay Seller",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );
    const buyerSession = await registerUser(
      {
        email: `pay-buyer-${suffix}@aspera.local`,
        password: "AsperaBuyerDevOnly1!",
        displayName: "Pay Buyer",
        intent: "customer",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminSession = await registerUser(
      {
        email: `pay-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Pay Admin",
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
      email: `pay-seller-${suffix}@aspera.local`,
      displayName: "Pay Seller",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const buyerActor: Actor = {
      userId: buyerSession.userId,
      email: `pay-buyer-${suffix}@aspera.local`,
      displayName: "Pay Buyer",
      roles: [{ key: "customer", sellerId: null }],
      sessionId: buyerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `pay-admin-${suffix}@aspera.local`,
      displayName: "Pay Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerDraft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Pay Traders Private Limited",
        tradeName: "Pay Mart",
        contactEmail: `pay-ops-${suffix}@aspera.local`,
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
        reason: "Dev approval",
        expectedVersion: sellerSubmitted.version,
      },
      crypto.randomUUID(),
    );

    const created = await createProductDraft(
      sellerActor,
      {
        sellerId: sellerDraft.id,
        categoryId: category.id,
        title: "Payment test notebook",
        summary: "Ruled notebook for payment webhook integration tests.",
        description:
          "Fictional listing used to validate order creation and mock payment capture.",
        countryOfOrigin: "India",
        variant: {
          sku: `NB-${suffix.toUpperCase()}`,
          title: "A5",
          mrpPaise: 29900,
          sellingPricePaise: 19900,
          initialStock: 20,
          weightGrams: 200,
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
        reason: "Dev catalogue approval",
        expectedVersion: submitted.version,
      },
      crypto.randomUUID(),
    );

    await addCartItem(
      buyerActor,
      { variantId: created.variant.id, quantity: 1 },
      crypto.randomUUID(),
    );
    const address = await createAddress(
      buyerActor,
      {
        label: "Home",
        fullName: "Pay Buyer",
        phone: "9876543210",
        line1: "1 Residency Road",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560025",
        country: "IN",
        isDefault: true,
      },
      crypto.randomUUID(),
    );
    const preview = await previewCheckout(buyerActor, {
      addressId: address.id,
    });
    const reserved = await confirmCheckout(
      buyerActor,
      {
        addressId: address.id,
        clientTotalPaise: preview.snapshot.totalPaise,
        expectedCartVersion: preview.cart.version,
        idempotencyKey: `chk-${suffix}`,
      },
      crypto.randomUUID(),
    );

    const orderResult = await createOrderFromCheckout(
      buyerActor,
      {
        checkoutSessionId: reserved.checkout.id,
        idempotencyKey: `ord-${suffix}`,
      },
      crypto.randomUUID(),
    );
    expect(orderResult.order.status).toBe("awaiting_payment");

    const payment = await startPayment(
      buyerActor,
      {
        orderId: orderResult.order.id,
        idempotencyKey: `pay-${suffix}`,
      },
      crypto.randomUUID(),
    );

    const provider = new MockPaymentProvider();
    const payload = JSON.stringify({
      id: `evt-${suffix}`,
      type: "payment.succeeded",
      createdAt: new Date().toISOString(),
      data: {
        providerReference: payment.payment.providerReference,
        amountPaise: payment.payment.amountPaise,
        currencyCode: "INR",
      },
    });
    const signature = provider.signPayload(payload);
    const first = await processPaymentWebhook({
      rawBody: payload,
      signatureHeader: `sha256=${signature}`,
      correlationId: crypto.randomUUID(),
    });
    expect(first.replayed).toBe(false);

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderResult.order.id },
      include: { invoices: true },
    });
    expect(order.status).toBe("paid");
    expect(order.invoices).toHaveLength(1);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: created.variant.id },
    });
    expect(inventory.onHand).toBe(19);
    expect(inventory.reserved).toBe(0);

    const replay = await processPaymentWebhook({
      rawBody: payload,
      signatureHeader: `sha256=${signature}`,
      correlationId: crypto.randomUUID(),
    });
    expect(replay.replayed).toBe(true);

    const notification = await prisma.notificationMessage.findFirst({
      where: { recipient: buyerActor.email, templateKey: "order.paid" },
    });
    expect(notification?.status).toBe("sent");
  });
});
