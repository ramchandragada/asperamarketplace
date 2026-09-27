-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'suspended', 'deleted');

-- CreateEnum
CREATE TYPE "public"."SellerStatus" AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "public"."KycCaseStatus" AS ENUM ('open', 'complete', 'rejected');

-- CreateEnum
CREATE TYPE "public"."KycStage" AS ENUM ('business_profile', 'documents', 'agreement', 'risk_screening', 'manual_review');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "scope_key" TEXT NOT NULL DEFAULT 'global',
    "seller_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_attempts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sellers" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "status" "public"."SellerStatus" NOT NULL,
    "status_reason" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "pan_last4" TEXT,
    "gstin_masked" TEXT,
    "registered_state" TEXT,
    "agreement_accepted_at" TIMESTAMPTZ(6),
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewed_by_user_id" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seller_kyc_cases" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "stage" "public"."KycStage" NOT NULL,
    "status" "public"."KycCaseStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "seller_kyc_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kyc_documents" (
    "id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "kyc_case_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "checksum_sha256" TEXT NOT NULL,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "public"."roles"("key");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_scope_key_key" ON "public"."user_roles"("user_id", "role_id", "scope_key");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "public"."sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "public"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "public"."sessions"("expires_at");

-- CreateIndex
CREATE INDEX "login_attempts_email_created_at_idx" ON "public"."login_attempts"("email", "created_at");

-- CreateIndex
CREATE INDEX "sellers_status_idx" ON "public"."sellers"("status");

-- CreateIndex
CREATE INDEX "sellers_owner_user_id_idx" ON "public"."sellers"("owner_user_id");

-- CreateIndex
CREATE INDEX "seller_kyc_cases_seller_id_idx" ON "public"."seller_kyc_cases"("seller_id");

-- CreateIndex
CREATE INDEX "kyc_documents_seller_id_idx" ON "public"."kyc_documents"("seller_id");

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sellers" ADD CONSTRAINT "sellers_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sellers" ADD CONSTRAINT "sellers_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seller_kyc_cases" ADD CONSTRAINT "seller_kyc_cases_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kyc_documents" ADD CONSTRAINT "kyc_documents_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kyc_documents" ADD CONSTRAINT "kyc_documents_kyc_case_id_fkey" FOREIGN KEY ("kyc_case_id") REFERENCES "public"."seller_kyc_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."kyc_documents" ADD CONSTRAINT "kyc_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
