-- CreateEnum
CREATE TYPE "public"."RiskCaseStatus" AS ENUM ('open', 'investigating', 'mitigated', 'closed');

-- CreateEnum
CREATE TYPE "public"."CounterfeitCaseStatus" AS ENUM ('reported', 'under_review', 'upheld', 'dismissed');

-- CreateEnum
CREATE TYPE "public"."ReviewModerationStatus" AS ENUM ('pending', 'approved', 'rejected', 'hidden');

-- CreateEnum
CREATE TYPE "public"."PrivacyRequestStatus" AS ENUM ('received', 'in_progress', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "public"."ComplianceEvidenceStatus" AS ENUM ('draft', 'submitted', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "public"."risk_cases" (
    "id" UUID NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "public"."RiskCaseStatus" NOT NULL DEFAULT 'open',
    "status_reason" TEXT,
    "opened_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "closed_at" TIMESTAMPTZ(6),

    CONSTRAINT "risk_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."counterfeit_cases" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "reporter_id" UUID,
    "brand_claim" TEXT NOT NULL,
    "evidence_note" TEXT NOT NULL,
    "status" "public"."CounterfeitCaseStatus" NOT NULL DEFAULT 'reported',
    "status_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "counterfeit_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_reviews" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "public"."ReviewModerationStatus" NOT NULL DEFAULT 'pending',
    "status_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."privacy_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "status" "public"."PrivacyRequestStatus" NOT NULL DEFAULT 'received',
    "status_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compliance_evidence" (
    "id" UUID NOT NULL,
    "register_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence_uri" TEXT,
    "status" "public"."ComplianceEvidenceStatus" NOT NULL DEFAULT 'draft',
    "submitted_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "compliance_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_cases_status_severity_idx" ON "public"."risk_cases"("status", "severity");

-- CreateIndex
CREATE INDEX "risk_cases_subject_type_subject_id_idx" ON "public"."risk_cases"("subject_type", "subject_id");

-- CreateIndex
CREATE INDEX "counterfeit_cases_status_idx" ON "public"."counterfeit_cases"("status");

-- CreateIndex
CREATE INDEX "counterfeit_cases_seller_id_status_idx" ON "public"."counterfeit_cases"("seller_id", "status");

-- CreateIndex
CREATE INDEX "counterfeit_cases_product_id_idx" ON "public"."counterfeit_cases"("product_id");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_status_idx" ON "public"."product_reviews"("product_id", "status");

-- CreateIndex
CREATE INDEX "product_reviews_user_id_idx" ON "public"."product_reviews"("user_id");

-- CreateIndex
CREATE INDEX "product_reviews_status_idx" ON "public"."product_reviews"("status");

-- CreateIndex
CREATE INDEX "privacy_requests_user_id_status_idx" ON "public"."privacy_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "privacy_requests_status_idx" ON "public"."privacy_requests"("status");

-- CreateIndex
CREATE INDEX "compliance_evidence_register_key_status_idx" ON "public"."compliance_evidence"("register_key", "status");

