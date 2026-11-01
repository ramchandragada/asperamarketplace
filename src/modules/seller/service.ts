import { KycCaseStatus, KycStage, type Prisma } from "@prisma/client";
import { prisma } from "@/platform/db/prisma";
import {
  AuthorizationError,
  actorCanStartSellerApplication,
  requireAdmin,
  type Actor,
} from "@/modules/identity/policy";
import { maskGstin, maskPan } from "@/modules/identity/crypto";
import type {
  AdminSetSellerGstinInput,
  CreateSellerDraftInput,
  DeleteSellerApplicationInput,
  ReviewSellerInput,
  SubmitSellerInput,
} from "@/modules/seller/schema";
import { assertSellerTransition } from "@/modules/seller/states";
import { NotFoundError } from "@/platform/http/errors";
import {
  createDocumentStorage,
  StorageValidationError,
} from "@/platform/storage/local";

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
  if (!actorCanStartSellerApplication(actor)) {
    throw new AuthorizationError(
      "Seller staff accounts cannot start a new seller application. Sign out and use a customer account (or register a new one) to apply.",
    );
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
        gstin: input.gstin,
        gstinMasked: maskGstin(input.gstin),
        registeredState: input.registeredState,
        pickupCity: input.pickupCity,
        pickupLine1: input.pickupLine1,
        pickupPostalCode: input.pickupPostalCode,
        bankAccountHolder: input.bankAccountHolder,
        bankName: input.bankName,
        bankIfsc: input.bankIfsc,
        bankAccountLast4: input.bankAccountNumber.slice(-4),
        fulfilmentBy: "seller_shop",
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

    // Bind owner capability as soon as the draft exists so Seller console
    // chrome and /seller routes recognize the applicant (approval still required
    // for a live catalogue).
    const ownerRole = await tx.role.findUniqueOrThrow({
      where: { key: "seller_owner" },
    });
    await tx.userRole.upsert({
      where: {
        userId_roleId_scopeKey: {
          userId: actor.userId,
          roleId: ownerRole.id,
          scopeKey: seller.id,
        },
      },
      create: {
        userId: actor.userId,
        roleId: ownerRole.id,
        scopeKey: seller.id,
        sellerId: seller.id,
      },
      update: { sellerId: seller.id },
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
  if (!seller.gstin) {
    throw new ValidationError("GSTIN is required before submitting for review");
  }
  if (!seller.pickupCity) {
    throw new ValidationError("Pickup city is required before submitting");
  }
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

export type AdminSellerTab = "pending" | "approved" | "suspended" | "all";
export type AdminSellerCounts = {
  pending: number;
  approved: number;
  suspended: number;
  all: number;
};

/**
 * Admin seller queue: server-side filtered (by tab + search) and bounded.
 * Previously this loaded every seller and filtered in the browser.
 */
export async function listSellersForAdmin(
  actor: Actor,
  options: { tab?: AdminSellerTab; search?: string; take?: number } = {},
) {
  requireAdmin(actor);
  const take = Math.min(Math.max(options.take ?? 50, 1), 200);
  const tab = options.tab ?? "pending";

  const statusWhere: Prisma.SellerWhereInput =
    tab === "approved"
      ? { status: "approved" }
      : tab === "suspended"
        ? { status: "suspended" }
        : tab === "pending"
          ? { status: { in: ["submitted", "under_review"] } }
          : {};

  const search = options.search?.trim();
  const searchWhere: Prisma.SellerWhereInput = search
    ? {
        OR: [
          { legalName: { contains: search, mode: "insensitive" } },
          { tradeName: { contains: search, mode: "insensitive" } },
          { contactEmail: { contains: search, mode: "insensitive" } },
          { gstinMasked: { contains: search, mode: "insensitive" } },
          { owner: { email: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  const [rows, grouped] = await Promise.all([
    prisma.seller.findMany({
      where: { AND: [statusWhere, searchWhere] },
      orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
      take: take + 1,
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        documents: {
          select: {
            id: true,
            documentType: true,
            fileName: true,
            contentType: true,
            storageKey: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.seller.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const hasMore = rows.length > take;
  const sellers = hasMore ? rows.slice(0, take) : rows;

  const counts: AdminSellerCounts = {
    pending: 0,
    approved: 0,
    suspended: 0,
    all: 0,
  };
  for (const group of grouped) {
    const n = group._count._all;
    counts.all += n;
    if (group.status === "approved") counts.approved += n;
    else if (group.status === "suspended") counts.suspended += n;
    else if (group.status === "submitted" || group.status === "under_review")
      counts.pending += n;
  }

  return { sellers, counts, hasMore };
}

export async function getSellerDocumentForAdmin(
  actor: Actor,
  sellerId: string,
  documentId: string,
) {
  requireAdmin(actor);
  const document = await prisma.kycDocument.findFirst({
    where: { id: documentId, sellerId },
    select: {
      id: true,
      fileName: true,
      contentType: true,
      storageKey: true,
      byteSize: true,
    },
  });
  if (!document) {
    throw new NotFoundError("Document not found for this seller");
  }
  const storage = createDocumentStorage();
  try {
    const bytes = await storage.get(document.storageKey);
    return { document, bytes };
  } catch (error) {
    if (error instanceof StorageValidationError) throw error;
    // Local disk does not persist on Vercel — missing bytes must be 404, not 500.
    throw new NotFoundError("Document file not available");
  }
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

  if (input.decision === "request_info") {
    if (seller.status !== "submitted" && seller.status !== "under_review") {
      throw new ConflictError("Seller is not waiting for review");
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.seller.update({
        where: { id: seller.id, version: seller.version },
        data: {
          statusReason: input.reason,
          reviewedAt: new Date(),
          reviewedByUserId: actor.userId,
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "seller.request_info",
          targetType: "seller",
          targetId: seller.id,
          beforeState: {
            status: seller.status,
            statusReason: seller.statusReason,
            version: seller.version,
          },
          afterState: {
            status: updated.status,
            statusReason: updated.statusReason,
            version: updated.version,
            reason: input.reason,
          },
          reason: input.reason,
          correlationId,
        },
      });
      return updated;
    });
  }

  if (input.decision === "suspend") {
    if (seller.status !== "approved") {
      throw new ConflictError("Only approved sellers can be suspended");
    }
    assertSellerTransition("approved", "suspended");
    return prisma.$transaction(async (tx) => {
      const updated = await tx.seller.update({
        where: { id: seller.id, version: seller.version },
        data: {
          status: "suspended",
          statusReason: input.reason,
          reviewedAt: new Date(),
          reviewedByUserId: actor.userId,
          version: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "seller.suspended",
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
          eventType: "SellerSuspended",
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

  if (input.decision === "reactivate") {
    if (seller.status !== "suspended") {
      throw new ConflictError("Only suspended sellers can be reactivated");
    }
    assertSellerTransition("suspended", "under_review");
    return prisma.$transaction(async (tx) => {
      const updated = await tx.seller.update({
        where: { id: seller.id, version: seller.version },
        data: {
          status: "under_review",
          statusReason: input.reason,
          reviewedAt: new Date(),
          reviewedByUserId: actor.userId,
          version: { increment: 1 },
        },
      });
      await tx.sellerKycCase.create({
        data: {
          sellerId: seller.id,
          stage: KycStage.manual_review,
          status: KycCaseStatus.open,
          notes: input.reason,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: actor.userId,
          action: "seller.reactivated",
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
          eventType: "SellerReactivated",
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

  const nextStatus = input.decision === "approve" ? "approved" : "rejected";
  if (seller.status !== "submitted" && seller.status !== "under_review") {
    throw new ConflictError("Seller is not waiting for review");
  }
  if (nextStatus === "approved" && !seller.gstin) {
    throw new ConflictError(
      "Cannot approve a seller without a Regular GSTIN on file",
    );
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

/**
 * Attach a real Regular GSTIN after document review, then optionally
 * approve + republish draft catalogue so the shop can stay live.
 */
export async function adminSetSellerGstin(
  actor: Actor,
  input: AdminSetSellerGstinInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const seller = await prisma.seller.findUnique({ where: { id: input.sellerId } });
  if (!seller) throw new NotFoundError("Seller not found");
  if (seller.version !== input.expectedVersion) {
    throw new ConflictError(
      "Seller was updated by another operator. Reload and retry.",
    );
  }

  const clash = await prisma.seller.findFirst({
    where: { gstin: input.gstin, NOT: { id: seller.id } },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictError("That GSTIN is already registered to another seller");
  }

  return prisma.$transaction(async (tx) => {
    const shouldApprove =
      input.republish &&
      (seller.status === "suspended" ||
        seller.status === "submitted" ||
        seller.status === "under_review" ||
        seller.status === "draft");

    const updated = await tx.seller.update({
      where: { id: seller.id, version: seller.version },
      data: {
        gstin: input.gstin,
        gstinMasked: maskGstin(input.gstin),
        registeredState: input.registeredState,
        pickupCity: input.pickupCity,
        fulfilmentBy: seller.fulfilmentBy || "seller_shop",
        statusReason: shouldApprove ? null : seller.statusReason,
        ...(shouldApprove
          ? {
              status: "approved" as const,
              approvedAt: new Date(),
              reviewedAt: new Date(),
              reviewedByUserId: actor.userId,
            }
          : {}),
        version: { increment: 1 },
      },
    });

    let republished = 0;
    if (input.republish && updated.status === "approved") {
      const result = await tx.product.updateMany({
        where: {
          sellerId: seller.id,
          status: { in: ["draft", "submitted"] },
        },
        data: {
          status: "approved",
          publishedAt: new Date(),
          reviewedAt: new Date(),
          reviewedByUserId: actor.userId,
        },
      });
      republished = result.count;
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "seller.gstin_set",
        targetType: "seller",
        targetId: seller.id,
        beforeState: {
          status: seller.status,
          gstinMasked: seller.gstinMasked,
          version: seller.version,
        },
        afterState: {
          status: updated.status,
          gstinMasked: updated.gstinMasked,
          version: updated.version,
          republished,
        },
        reason: "Admin recorded verified Regular GSTIN for live catalogue",
        correlationId,
      },
    });

    return { seller: updated, republished };
  });
}

/**
 * Permanently remove a seller that never went live (no catalogue / orders).
 * Frees the GSTIN so the dealer can apply again.
 */
export async function deleteSellerApplication(
  actor: Actor,
  input: DeleteSellerApplicationInput,
  correlationId: string,
) {
  requireAdmin(actor);

  const seller = await prisma.seller.findUnique({
    where: { id: input.sellerId },
    include: {
      _count: {
        select: {
          products: true,
          fulfilmentGroups: true,
          offers: true,
        },
      },
    },
  });
  if (!seller) {
    throw new NotFoundError("Seller not found");
  }
  if (seller.version !== input.expectedVersion) {
    throw new ConflictError(
      "Seller was updated by another operator. Reload and retry.",
    );
  }
  const removable = ["draft", "submitted", "under_review", "rejected"] as const;
  if (
    !removable.includes(seller.status as (typeof removable)[number]) ||
    seller._count.products > 0 ||
    seller._count.fulfilmentGroups > 0 ||
    seller._count.offers > 0
  ) {
    throw new ConflictError(
      "Only empty draft/submitted/rejected applications can be deleted",
    );
  }

  const ownerUserId = seller.ownerUserId;

  await prisma.$transaction(async (tx) => {
    await tx.kycDocument.deleteMany({ where: { sellerId: seller.id } });
    await tx.sellerKycCase.deleteMany({ where: { sellerId: seller.id } });
    await tx.userRole.deleteMany({ where: { sellerId: seller.id } });
    await tx.seller.delete({ where: { id: seller.id } });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "seller.application_deleted",
        targetType: "seller",
        targetId: seller.id,
        beforeState: {
          legalName: seller.legalName,
          status: seller.status,
          gstinMasked: seller.gstinMasked,
          ownerUserId,
        },
        reason: input.reason,
        correlationId,
      },
    });

    // Remove the orphan applicant login when they have no other seller roles
    // and no other owned shops.
    const otherOwned = await tx.seller.count({
      where: { ownerUserId },
    });
    const otherSellerRoles = await tx.userRole.count({
      where: {
        userId: ownerUserId,
        role: {
          key: {
            in: [
              "seller_owner",
              "seller_operations",
              "seller_finance",
              "seller_support",
              "admin",
              "super_admin",
            ],
          },
        },
      },
    });
    if (otherOwned === 0 && otherSellerRoles === 0) {
      await tx.session.deleteMany({ where: { userId: ownerUserId } });
      await tx.userRole.deleteMany({ where: { userId: ownerUserId } });
      await tx.user.delete({ where: { id: ownerUserId } });
    }
  });

  return { deletedSellerId: seller.id, deletedOwnerUserId: ownerUserId };
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
