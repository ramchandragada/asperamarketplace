import { prisma } from "@/platform/db/prisma";
import {
  actorIsAdmin,
  AuthorizationError,
  type Actor,
} from "@/modules/identity/policy";
import type {
  CreateComplianceEvidenceInput,
  CreatePrivacyRequestInput,
  CreateReviewInput,
  ModerateReviewInput,
  OpenRiskCaseInput,
  ReportCounterfeitInput,
  ReviewCounterfeitInput,
  SubmitComplianceEvidenceInput,
  UpdatePrivacyRequestInput,
  UpdateRiskCaseInput,
} from "@/modules/trust/schema";

export class TrustValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "TrustValidationError";
  }
}

function requireAdmin(actor: Actor) {
  if (!actorIsAdmin(actor)) {
    throw new AuthorizationError("Administrator role required");
  }
}

export async function openRiskCase(
  actor: Actor,
  input: OpenRiskCaseInput,
  correlationId: string,
) {
  requireAdmin(actor);
  return prisma.$transaction(async (tx) => {
    const created = await tx.riskCase.create({
      data: {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        severity: input.severity,
        title: input.title,
        details: input.details,
        openedById: actor.userId,
        status: "open",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "risk.opened",
        targetType: "risk_case",
        targetId: created.id,
        afterState: { severity: input.severity, subjectType: input.subjectType },
        reason: input.title,
        correlationId,
      },
    });
    return created;
  });
}

export async function updateRiskCase(
  actor: Actor,
  input: UpdateRiskCaseInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.riskCase.findUniqueOrThrow({
    where: { id: input.riskCaseId },
  });
  if (existing.status === "closed") {
    throw new TrustValidationError("Risk case is already closed");
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.riskCase.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        statusReason: input.reason,
        closedAt: input.status === "closed" ? new Date() : existing.closedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "risk.updated",
        targetType: "risk_case",
        targetId: existing.id,
        afterState: { status: input.status },
        reason: input.reason,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listRiskCases(actor: Actor) {
  requireAdmin(actor);
  return prisma.riskCase.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export async function reportCounterfeit(
  actor: Actor,
  input: ReportCounterfeitInput,
  correlationId: string,
) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw new TrustValidationError("Product not found");
  }
  return prisma.$transaction(async (tx) => {
    const created = await tx.counterfeitCase.create({
      data: {
        productId: input.productId,
        sellerId: input.sellerId,
        reporterId: actor.userId,
        brandClaim: input.brandClaim,
        evidenceNote: input.evidenceNote,
        status: "reported",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "counterfeit.reported",
        targetType: "counterfeit_case",
        targetId: created.id,
        afterState: { productId: input.productId, brandClaim: input.brandClaim },
        reason: input.evidenceNote.slice(0, 200),
        correlationId,
      },
    });
    return created;
  });
}

export async function reviewCounterfeit(
  actor: Actor,
  input: ReviewCounterfeitInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.counterfeitCase.findUniqueOrThrow({
    where: { id: input.caseId },
  });
  if (existing.status !== "reported" && existing.status !== "under_review") {
    throw new TrustValidationError("Counterfeit case is not reviewable");
  }
  const next = input.decision === "uphold" ? "upheld" : "dismissed";
  return prisma.$transaction(async (tx) => {
    const updated = await tx.counterfeitCase.update({
      where: { id: existing.id },
      data: {
        status: next,
        statusReason: input.reason,
        resolvedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "counterfeit.reviewed",
        targetType: "counterfeit_case",
        targetId: existing.id,
        afterState: { status: next },
        reason: input.reason,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listCounterfeitCases(actor: Actor) {
  requireAdmin(actor);
  return prisma.counterfeitCase.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createProductReview(
  actor: Actor,
  input: CreateReviewInput,
  correlationId: string,
) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || product.status !== "approved") {
    throw new TrustValidationError("Product is not available for review");
  }
  return prisma.$transaction(async (tx) => {
    const created = await tx.productReview.create({
      data: {
        productId: input.productId,
        userId: actor.userId,
        orderId: input.orderId,
        rating: input.rating,
        title: input.title,
        body: input.body,
        status: "pending",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "review.created",
        targetType: "product_review",
        targetId: created.id,
        afterState: { rating: input.rating, productId: input.productId },
        reason: "Customer submitted review pending moderation",
        correlationId,
      },
    });
    return created;
  });
}

export async function moderateReview(
  actor: Actor,
  input: ModerateReviewInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.productReview.findUniqueOrThrow({
    where: { id: input.reviewId },
  });
  const next =
    input.decision === "approve"
      ? "approved"
      : input.decision === "hide"
        ? "hidden"
        : "rejected";
  return prisma.$transaction(async (tx) => {
    const updated = await tx.productReview.update({
      where: { id: existing.id },
      data: { status: next, statusReason: input.reason },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "review.moderated",
        targetType: "product_review",
        targetId: existing.id,
        afterState: { status: next },
        reason: input.reason,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listReviewsForModeration(actor: Actor) {
  requireAdmin(actor);
  return prisma.productReview.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function listApprovedReviewsForProduct(productId: string) {
  return prisma.productReview.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createPrivacyRequest(
  actor: Actor,
  input: CreatePrivacyRequestInput,
  correlationId: string,
) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.privacyRequest.create({
      data: {
        userId: actor.userId,
        requestType: input.requestType,
        details: input.details,
        status: "received",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "privacy.requested",
        targetType: "privacy_request",
        targetId: created.id,
        afterState: { requestType: input.requestType },
        reason: "Customer privacy request received",
        correlationId,
      },
    });
    return created;
  });
}

export async function updatePrivacyRequest(
  actor: Actor,
  input: UpdatePrivacyRequestInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.privacyRequest.findUniqueOrThrow({
    where: { id: input.privacyRequestId },
  });
  return prisma.$transaction(async (tx) => {
    const updated = await tx.privacyRequest.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        statusReason: input.reason,
        completedAt:
          input.status === "completed" || input.status === "rejected"
            ? new Date()
            : existing.completedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "privacy.updated",
        targetType: "privacy_request",
        targetId: existing.id,
        afterState: { status: input.status },
        reason: input.reason,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listPrivacyRequests(actor: Actor) {
  if (actorIsAdmin(actor)) {
    return prisma.privacyRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  return prisma.privacyRequest.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createComplianceEvidence(
  actor: Actor,
  input: CreateComplianceEvidenceInput,
  correlationId: string,
) {
  requireAdmin(actor);
  return prisma.$transaction(async (tx) => {
    const created = await tx.complianceEvidence.create({
      data: {
        registerKey: input.registerKey,
        title: input.title,
        summary: input.summary,
        evidenceUri: input.evidenceUri,
        submittedById: actor.userId,
        status: "draft",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "compliance.evidence_created",
        targetType: "compliance_evidence",
        targetId: created.id,
        afterState: { registerKey: input.registerKey },
        reason: input.title,
        correlationId,
      },
    });
    return created;
  });
}

export async function submitComplianceEvidence(
  actor: Actor,
  input: SubmitComplianceEvidenceInput,
  correlationId: string,
) {
  requireAdmin(actor);
  const existing = await prisma.complianceEvidence.findUniqueOrThrow({
    where: { id: input.evidenceId },
  });
  const next =
    input.decision === "submit"
      ? "submitted"
      : input.decision === "accept"
        ? "accepted"
        : "rejected";
  return prisma.$transaction(async (tx) => {
    const updated = await tx.complianceEvidence.update({
      where: { id: existing.id },
      data: { status: next },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.userId,
        action: "compliance.evidence_updated",
        targetType: "compliance_evidence",
        targetId: existing.id,
        afterState: { status: next },
        reason: input.reason,
        correlationId,
      },
    });
    return updated;
  });
}

export async function listComplianceEvidence(actor: Actor) {
  requireAdmin(actor);
  return prisma.complianceEvidence.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function trustOpsSummary(actor: Actor) {
  requireAdmin(actor);
  const [risk, counterfeit, reviews, privacy, compliance] = await Promise.all([
    prisma.riskCase.count({ where: { status: { in: ["open", "investigating"] } } }),
    prisma.counterfeitCase.count({
      where: { status: { in: ["reported", "under_review"] } },
    }),
    prisma.productReview.count({ where: { status: "pending" } }),
    prisma.privacyRequest.count({
      where: { status: { in: ["received", "in_progress"] } },
    }),
    prisma.complianceEvidence.count({
      where: { status: { in: ["draft", "submitted"] } },
    }),
  ]);
  return { risk, counterfeit, reviews, privacy, compliance };
}
