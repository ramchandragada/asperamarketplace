import { KycCaseStatus, KycStage } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import {
  AuthorizationError,
  requireAdmin,
  type Actor,
} from "@/modules/identity/policy";
import { maskGstin, maskPan } from "@/modules/identity/crypto";
import type {
  CreateSellerDraftInput,
  ReviewSellerInput,
  SubmitSellerInput,
} from "@/modules/seller/schema";
import { assertSellerTransition } from "@/modules/seller/states";
import { createDocumentStorage } from "@/platform/storage/local";

function assertSellerOwner(actor: Actor, ownerUserId: string) {
  if (actor.userId !== ownerUserId) {
    throw new AuthorizationError("Only the seller owner can perform this action");
  }
}

export async function createSellerDraft(
  actor: Actor,
  input: CreateSellerDraftInput,
  correlationId: string,
) {
  const canStart = actor.roles.some(
    (role) =>
      role.key === "seller_owner" ||
      role.key === "customer" ||
      role.key === "admin" ||
      role.key === "super_admin",
  );
  if (!canStart) {
    throw new AuthorizationError("An authenticated account is required");
  }

  return prisma.$transaction(async (tx) => {
    const seller = await tx.seller.create({
      data: {
        ownerUserId: actor.userId,
        legalName: input.legalName,
        tradeName: input.tradeName,
        status: "draft",
        contactEmail: input.contactEmail.toLowerCase(),
        contactPhone: input.contactPhone,
        panLast4: maskPan(input.pan),
        gstinMasked: input.gstin ? maskGstin(input.gstin) : null,
        registeredState: input.registeredState,
      },
    });

    await tx.sellerKycCase.create({
      data: {
        sellerId: seller.id,
        stage: KycStage.business_profile,
        status: KycCaseStatus.complete,
        notes: "Business profile captured",
      },
    });
    await tx.sellerKycCase.create({
      data: {
        sellerId: seller.id,
        stage: KycStage.documents,
        status: KycCaseStatus.open,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "seller.draft_created",
        targetType: "seller",
        targetId: seller.id,
        afterState: {
          legalName: seller.legalName,
          status: seller.status,
          panLast4: seller.panLast4,
          gstinMasked: seller.gstinMasked,
        },
        reason: "Seller started onboarding",
        correlationId,
      },
    });

    return seller;
  });
}

export async function uploadSellerDocument(input: {
  actor: Actor;
  sellerId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
  correlationId: string;
}) {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: input.sellerId },
  });
  assertSellerOwner(input.actor, seller.ownerUserId);
  if (seller.status !== "draft" && seller.status !== "rejected") {
    throw new AuthorizationError("Documents can only be uploaded while drafting");
  }

  const openCase = await prisma.sellerKycCase.findFirst({
    where: {
      sellerId: seller.id,
      stage: KycStage.documents,
      status: KycCaseStatus.open,
    },
  });
  if (!openCase) {
    throw new AuthorizationError("No open document KYC case");
  }

  const storage = createDocumentStorage();
  const stored = await storage.put({
    namespace: `sellers/${seller.id}`,
    fileName: input.fileName,
    contentType: input.contentType,
    bytes: input.bytes,
  });

  return prisma.$transaction(async (tx) => {
    const document = await tx.kycDocument.create({
      data: {
        sellerId: seller.id,
        kycCaseId: openCase.id,
        documentType: input.documentType,
        storageKey: stored.key,
        fileName: stored.fileName,
        contentType: stored.contentType,
        byteSize: stored.byteSize,
        checksumSha256: stored.checksumSha256,
        uploadedByUserId: input.actor.userId,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: input.actor.userId,
        action: "seller.document_uploaded",
        targetType: "kyc_document",
        targetId: document.id,
        afterState: {
          documentType: document.documentType,
          byteSize: document.byteSize,
          checksumSha256: document.checksumSha256,
        },
        reason: "KYC document uploaded",
        correlationId: input.correlationId,
      },
    });
    return document;
  });
}

export async function submitSellerForReview(
  actor: Actor,
  input: SubmitSellerInput,
  correlationId: string,
) {
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: input.sellerId },
    include: { documents: true },
  });
  assertSellerOwner(actor, seller.ownerUserId);
  assertSellerTransition(seller.status, "submitted");
  if (seller.documents.length < 1) {
    throw new ValidationError("Upload at least one KYC document before submitting");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.seller.update({
      where: { id: seller.id, version: seller.version },
      data: {
        status: "submitted",
        agreementAcceptedAt: new Date(),
        submittedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.sellerKycCase.updateMany({
      where: { sellerId: seller.id, stage: KycStage.documents },
      data: { status: KycCaseStatus.complete },
    });
    await tx.sellerKycCase.create({
      data: {
        sellerId: seller.id,
        stage: KycStage.manual_review,
        status: KycCaseStatus.open,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "seller.submitted",
        targetType: "seller",
        targetId: seller.id,
        beforeState: { status: seller.status, version: seller.version },
        afterState: { status: updated.status, version: updated.version },
        reason: "Seller accepted agreement and submitted for review",
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType: "SellerSubmitted",
        aggregateType: "seller",
        aggregateId: seller.id,
        payload: { status: updated.status },
      },
    });
    return updated;
  });
}

export async function listSellersForAdmin(actor: Actor) {
  requireAdmin(actor);
  return prisma.seller.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      owner: { select: { id: true, email: true, displayName: true } },
      documents: {
        select: {
          id: true,
          documentType: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function reviewSeller(
  actor: Actor,
  input: ReviewSellerInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: input.sellerId },
  });
  if (seller.version !== input.expectedVersion) {
    throw new ConflictError("Seller was updated by another operator. Reload and retry.");
  }

  const nextStatus = input.decision === "approve" ? "approved" : "rejected";
  if (seller.status !== "submitted" && seller.status !== "under_review") {
    throw new ConflictError("Seller is not waiting for review");
  }

  return prisma.$transaction(async (tx) => {
    let version = seller.version;
    if (seller.status === "submitted") {
      assertSellerTransition("submitted", "under_review");
      const moved = await tx.seller.update({
        where: { id: seller.id, version },
        data: {
          status: "under_review",
          version: { increment: 1 },
        },
      });
      version = moved.version;
    }

    assertSellerTransition("under_review", nextStatus);
    const updated = await tx.seller.update({
      where: { id: seller.id, version },
      data: {
        status: nextStatus,
        statusReason: input.reason,
        reviewedAt: new Date(),
        reviewedByUserId: actor.userId,
        approvedAt: nextStatus === "approved" ? new Date() : null,
        version: { increment: 1 },
      },
    });

    await tx.sellerKycCase.updateMany({
      where: {
        sellerId: seller.id,
        stage: KycStage.manual_review,
        status: KycCaseStatus.open,
      },
      data: {
        status:
          nextStatus === "approved"
            ? KycCaseStatus.complete
            : KycCaseStatus.rejected,
        notes: input.reason,
      },
    });

    if (nextStatus === "approved") {
      const role = await tx.role.findUniqueOrThrow({
        where: { key: "seller_owner" },
      });
      await tx.userRole.upsert({
        where: {
          userId_roleId_scopeKey: {
            userId: seller.ownerUserId,
            roleId: role.id,
            scopeKey: seller.id,
          },
        },
        create: {
          userId: seller.ownerUserId,
          roleId: role.id,
          scopeKey: seller.id,
          sellerId: seller.id,
        },
        update: {},
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action:
          nextStatus === "approved" ? "seller.approved" : "seller.rejected",
        targetType: "seller",
        targetId: seller.id,
        beforeState: { status: seller.status, version: seller.version },
        afterState: {
          status: updated.status,
          version: updated.version,
          reason: input.reason,
        },
        reason: input.reason,
        correlationId,
      },
    });
    await tx.outboxEvent.create({
      data: {
        eventType:
          nextStatus === "approved" ? "SellerApproved" : "SellerRejected",
        aggregateType: "seller",
        aggregateId: seller.id,
        payload: {
          status: updated.status,
          reason: input.reason,
          reviewedByUserId: actor.userId,
        },
      },
    });

    return updated;
  });
}

export async function listOwnedSellers(actor: Actor) {
  return prisma.seller.findMany({
    where: { ownerUserId: actor.userId },
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          fileName: true,
          createdAt: true,
        },
      },
    },
  });
}

export class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  readonly code = "CONFLICT";

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
