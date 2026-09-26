-- CreateEnum
CREATE TYPE "public"."ExperimentStatus" AS ENUM ('draft', 'running', 'paused', 'concluded');

-- CreateTable
CREATE TABLE "public"."analytics_events" (
    "id" UUID NOT NULL,
    "event_name" TEXT NOT NULL,
    "actor_id" UUID,
    "session_id" TEXT,
    "seller_id" UUID,
    "product_id" UUID,
    "order_id" UUID,
    "search_query" TEXT,
    "properties" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."experiments" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "status" "public"."ExperimentStatus" NOT NULL DEFAULT 'draft',
    "variants" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "ended_at" TIMESTAMPTZ(6),

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_event_name_created_at_idx" ON "public"."analytics_events"("event_name", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_seller_id_created_at_idx" ON "public"."analytics_events"("seller_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_search_query_idx" ON "public"."analytics_events"("search_query");

-- CreateIndex
CREATE UNIQUE INDEX "experiments_key_key" ON "public"."experiments"("key");

-- CreateIndex
CREATE INDEX "experiments_status_idx" ON "public"."experiments"("status");

