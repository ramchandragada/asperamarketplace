-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "reason" TEXT,
    "correlation_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."idempotency_records" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_code" TEXT,
    "response_body" JSONB,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."outbox_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."feature_flags" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platform_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_correlation_id_idx" ON "public"."audit_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "public"."idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_scope_key" ON "public"."idempotency_records"("key", "scope");

-- CreateIndex
CREATE INDEX "outbox_events_status_available_at_idx" ON "public"."outbox_events"("status", "available_at");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "public"."feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "public"."platform_settings"("key");
