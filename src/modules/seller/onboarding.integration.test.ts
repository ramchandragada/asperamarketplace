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
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { LocalObjectStorage } from "@/platform/storage/local";

const hasDatabase = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDatabase)("seller onboarding integration", () => {
  const uploadRoot = path.join(process.cwd(), "uploads", "kyc-test");

  afterAll(async () => {
    await rm(uploadRoot, { recursive: true, force: true });
    await prisma.$disconnect();
  });

  it("registers a seller, submits KYC, and approves with audit and outbox", async () => {
    process.env.DOCUMENT_STORAGE_PATH = uploadRoot;
    await ensureSystemRoles();

    const suffix = crypto.randomUUID().slice(0, 8);
    const sellerSession = await registerUser(
      {
        email: `seller-${suffix}@aspera.local`,
        password: "AsperaSellerDevOnly1!",
        displayName: "Integration Seller",
        intent: "seller",
      },
      { correlationId: crypto.randomUUID() },
    );

    const adminSession = await registerUser(
      {
        email: `admin-${suffix}@aspera.local`,
        password: "AsperaAdminDevOnly1!",
        displayName: "Integration Admin",
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
      email: `seller-${suffix}@aspera.local`,
      displayName: "Integration Seller",
      roles: [{ key: "seller_owner", sellerId: null }],
      sessionId: sellerSession.sessionId,
    };
    const adminActor: Actor = {
      userId: adminSession.userId,
      email: `admin-${suffix}@aspera.local`,
      displayName: "Integration Admin",
      roles: [{ key: "admin", sellerId: null }],
      sessionId: adminSession.sessionId,
    };

    const draft = await createSellerDraft(
      sellerActor,
      {
        legalName: "Integration Traders Private Limited",
        tradeName: "Integration Mart",
        contactEmail: `ops-${suffix}@aspera.local`,
        contactPhone: "9876543210",
        pan: "ABCDE1234F",
        gstin: "29ABCDE1234F1Z5",
        registeredState: "Karnataka",
      },
      crypto.randomUUID(),
    );

    expect(draft.panLast4).toBe("234F");
    expect(draft.gstinMasked).toBe("29****F1Z5");

    const pdf = Buffer.from("%PDF-1.4 fictional-kyc-document");
    await uploadSellerDocument({
      actor: sellerActor,
      sellerId: draft.id,
      documentType: "business_registration",
      fileName: "registration.pdf",
      contentType: "application/pdf",
      bytes: pdf,
      correlationId: crypto.randomUUID(),
    });

    const submitted = await submitSellerForReview(
      sellerActor,
      { sellerId: draft.id, acceptAgreement: true },
      crypto.randomUUID(),
    );
    expect(submitted.status).toBe("submitted");

    const approved = await reviewSeller(
      adminActor,
      {
        sellerId: draft.id,
        decision: "approve",
        reason: "Development review accepted",
        expectedVersion: submitted.version,
      },
      crypto.randomUUID(),
    );
    expect(approved.status).toBe("approved");

    const audit = await prisma.auditLog.findFirst({
      where: { targetId: draft.id, action: "seller.approved" },
    });
    const outbox = await prisma.outboxEvent.findFirst({
      where: { aggregateId: draft.id, eventType: "SellerApproved" },
    });
    expect(audit).not.toBeNull();
    expect(outbox).not.toBeNull();

    const storage = new LocalObjectStorage(uploadRoot);
    const document = await prisma.kycDocument.findFirstOrThrow({
      where: { sellerId: draft.id },
    });
    const bytes = await storage.get(document.storageKey);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});

describe("local object storage validation", () => {
  it("rejects unsupported content types", async () => {
    const root = path.join(process.cwd(), "uploads", "kyc-unit");
    await mkdir(root, { recursive: true });
    const storage = new LocalObjectStorage(root);
    await expect(
      storage.put({
        namespace: "test",
        fileName: "note.txt",
        contentType: "text/plain",
        bytes: Buffer.from("hello"),
      }),
    ).rejects.toMatchObject({ code: "STORAGE_VALIDATION" });
    await rm(root, { recursive: true, force: true });
  });
});
