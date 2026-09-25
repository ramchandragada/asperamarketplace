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
import {
  createReturnRequest,
  createSupportTicket,
  markDelivered,
  reviewReturnRequest,
  shipGroup,
  startProcessing,
} from "@/modules/fulfilment/service";
import { MockPaymentProvider } from "@/modules/payments/provider";
import { rm } from "node:fs/promises";
import path from "node:path";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("fulfilment and care integration", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "fulfilment-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("processes ship deliver return refund and ticket", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();
    const category = await ensureGenericCategory();
    const suffix = crypto.randomUUID().slice(0, 8);

    const sellerSession = await registerUser(
      {
        email: `ful-seller-${suffix}@aspera.local`,
        password: "AsperaSellerDevOnly1!",
        displayName: "Ful Seller",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );
    const buyerSession = await registerUser(
      {
        email: `ful-buyer-${suffix}@aspera.local`,
        password: "AsperaBuyerDevOnly1!",
        displayName: "Ful Buyer",
        intent: "customer",
      },
      { correlationId: crypto.randomUUID() },
    );
    const adminSession = await registerUser(
      {
        email: `ful-admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Ful Admin",
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
      email: `ful-seller-${suffix}@aspera.local`,
      displayName: "Ful Seller",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const buyerActor: Actor = {
      userId: buyerSession.userId,
      email: `ful-buyer-${suffix}@aspera.local`,
      displayName: "Ful Buyer",
      roles: [{ key: "customer", sellerId: null }],
      sessionId: buyerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `ful-admin-${suffix}@aspera.local`,
      displayName: "Ful Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const sellerDraft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Fulfilment Traders Private Limited",
        tradeName: "Ful Mart",
        contactEmail: `ful-ops-${suffix}@aspera.local`,
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
    sellerActor.roles = [{ key: "seller_owner", sellerId: sellerDraft.id }];

    const created = await createProductDraft(
      sellerActor,
      {
        sellerId: sellerDraft.id,
        categoryId: category.id,
        title: "Fulfilment test mug",
        summary: "Ceramic mug for fulfilment integration tests.",
        description:
          "Fictional listing used to validate process ship deliver return flows.",
        countryOfOrigin: "India",
        variant: {
          sku: `MG-${suffix.toUpperCase()}`,
          title: "White",
          mrpPaise: 49900,
          sellingPricePaise: 34900,
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
        fullName: "Ful Buyer",
        phone: "9876543210",
        line1: "2 Residency Road",
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
        idempotencyKey: `ful-chk-${suffix}`,
      },
      crypto.randomUUID(),
    );
    const orderResult = await createOrderFromCheckout(
      buyerActor,
      {
        checkoutSessionId: reserved.checkout.id,
        idempotencyKey: `ful-ord-${suffix}`,
      },
      crypto.randomUUID(),
    );
    const payment = await startPayment(
      buyerActor,
      {
        orderId: orderResult.order.id,
        idempotencyKey: `ful-pay-${suffix}`,
      },
      crypto.randomUUID(),
    );
    const provider = new MockPaymentProvider();
    const payload = JSON.stringify({
      id: `ful-evt-${suffix}`,
      type: "payment.succeeded",
      createdAt: new Date().toISOString(),
      data: {
        providerReference: payment.payment.providerReference,
        amountPaise: payment.payment.amountPaise,
        currencyCode: "INR",
      },
    });
    await processPaymentWebhook({
      rawBody: payload,
      signatureHeader: `sha256=${provider.signPayload(payload)}`,
      correlationId: crypto.randomUUID(),
    });

    const group = await prisma.orderFulfilmentGroup.findFirstOrThrow({
      where: { orderId: orderResult.order.id },
    });
    expect(group.status).toBe("pending");

    await startProcessing(
      sellerActor,
      { fulfilmentGroupId: group.id, reason: "Packing started" },
      crypto.randomUUID(),
    );
    const shipped = await shipGroup(
      sellerActor,
      { fulfilmentGroupId: group.id, carrier: "Mock Logistics" },
      crypto.randomUUID(),
    );
    expect(shipped.status).toBe("shipped");
    expect(shipped.trackingNumber).toBeTruthy();

    await markDelivered(
      sellerActor,
      { fulfilmentGroupId: group.id },
      crypto.randomUUID(),
    );
    const fulfilledOrder = await prisma.order.findUniqueOrThrow({
      where: { id: orderResult.order.id },
    });
    expect(fulfilledOrder.status).toBe("fulfilled");

    const line = await prisma.orderLine.findFirstOrThrow({
      where: { orderId: orderResult.order.id },
    });
    const returnRequest = await createReturnRequest(
      buyerActor,
      {
        orderId: orderResult.order.id,
        sellerId: sellerDraft.id,
        orderLineId: line.id,
        quantity: 1,
        reason: "Arrived damaged in mock delivery",
      },
      crypto.randomUUID(),
    );
    expect(returnRequest.status).toBe("requested");

    await reviewReturnRequest(
      sellerActor,
      {
        returnRequestId: returnRequest.id,
        decision: "approve",
        reason: "Mock return approved",
      },
      crypto.randomUUID(),
    );
    const refund = await prisma.refund.findFirst({
      where: { returnRequestId: returnRequest.id },
    });
    expect(refund?.status).toBe("succeeded");
    expect(refund?.amountPaise).toBe(34900);

    const inventory = await prisma.inventoryItem.findUniqueOrThrow({
      where: { variantId: created.variant.id },
    });
    expect(inventory.onHand).toBe(10);

    const ticket = await createSupportTicket(
      buyerActor,
      {
        orderId: orderResult.order.id,
        subject: "Mock delivery question",
        body: "Confirming return was processed for the mug.",
        priority: "normal",
      },
      crypto.randomUUID(),
    );
    expect(ticket.status).toBe("open");
  });
});
