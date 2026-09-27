--
-- PostgreSQL database dump
--

\restrict CDaGkNx8FQzykp293d4kkwApdLGGt1Vv3lba8faZbyAo7ubKJgOcMzgvRgn5jHA

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: aspera_dev
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO aspera_dev;

--
-- Name: CartStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."CartStatus" AS ENUM (
    'open',
    'checked_out',
    'abandoned'
);


ALTER TYPE public."CartStatus" OWNER TO aspera_dev;

--
-- Name: CheckoutStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."CheckoutStatus" AS ENUM (
    'draft',
    'reserved',
    'expired',
    'cancelled',
    'converted'
);


ALTER TYPE public."CheckoutStatus" OWNER TO aspera_dev;

--
-- Name: ComplianceEvidenceStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."ComplianceEvidenceStatus" AS ENUM (
    'draft',
    'submitted',
    'accepted',
    'rejected'
);


ALTER TYPE public."ComplianceEvidenceStatus" OWNER TO aspera_dev;

--
-- Name: CounterfeitCaseStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."CounterfeitCaseStatus" AS ENUM (
    'reported',
    'under_review',
    'upheld',
    'dismissed'
);


ALTER TYPE public."CounterfeitCaseStatus" OWNER TO aspera_dev;

--
-- Name: DisputeStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."DisputeStatus" AS ENUM (
    'opened',
    'under_review',
    'resolved',
    'closed'
);


ALTER TYPE public."DisputeStatus" OWNER TO aspera_dev;

--
-- Name: FulfilmentGroupStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."FulfilmentGroupStatus" AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);


ALTER TYPE public."FulfilmentGroupStatus" OWNER TO aspera_dev;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'draft',
    'issued',
    'voided'
);


ALTER TYPE public."InvoiceStatus" OWNER TO aspera_dev;

--
-- Name: JournalEntryStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."JournalEntryStatus" AS ENUM (
    'draft',
    'posted',
    'reversed'
);


ALTER TYPE public."JournalEntryStatus" OWNER TO aspera_dev;

--
-- Name: KycCaseStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."KycCaseStatus" AS ENUM (
    'open',
    'complete',
    'rejected'
);


ALTER TYPE public."KycCaseStatus" OWNER TO aspera_dev;

--
-- Name: KycStage; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."KycStage" AS ENUM (
    'business_profile',
    'documents',
    'agreement',
    'risk_screening',
    'manual_review'
);


ALTER TYPE public."KycStage" OWNER TO aspera_dev;

--
-- Name: LedgerAccountType; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."LedgerAccountType" AS ENUM (
    'asset',
    'liability',
    'revenue',
    'expense',
    'equity'
);


ALTER TYPE public."LedgerAccountType" OWNER TO aspera_dev;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'awaiting_payment',
    'paid',
    'payment_failed',
    'cancelled',
    'partially_cancelled',
    'fulfilled'
);


ALTER TYPE public."OrderStatus" OWNER TO aspera_dev;

--
-- Name: PaymentAttemptStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."PaymentAttemptStatus" AS ENUM (
    'created',
    'pending',
    'succeeded',
    'failed',
    'cancelled'
);


ALTER TYPE public."PaymentAttemptStatus" OWNER TO aspera_dev;

--
-- Name: PrivacyRequestStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."PrivacyRequestStatus" AS ENUM (
    'received',
    'in_progress',
    'completed',
    'rejected'
);


ALTER TYPE public."PrivacyRequestStatus" OWNER TO aspera_dev;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'draft',
    'submitted',
    'approved',
    'rejected',
    'archived'
);


ALTER TYPE public."ProductStatus" OWNER TO aspera_dev;

--
-- Name: ReconciliationStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."ReconciliationStatus" AS ENUM (
    'open',
    'investigating',
    'resolved',
    'written_off'
);


ALTER TYPE public."ReconciliationStatus" OWNER TO aspera_dev;

--
-- Name: RefundStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."RefundStatus" AS ENUM (
    'pending',
    'succeeded',
    'failed'
);


ALTER TYPE public."RefundStatus" OWNER TO aspera_dev;

--
-- Name: ReturnStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."ReturnStatus" AS ENUM (
    'requested',
    'approved',
    'rejected',
    'received',
    'closed'
);


ALTER TYPE public."ReturnStatus" OWNER TO aspera_dev;

--
-- Name: ReviewModerationStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."ReviewModerationStatus" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'hidden'
);


ALTER TYPE public."ReviewModerationStatus" OWNER TO aspera_dev;

--
-- Name: RiskCaseStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."RiskCaseStatus" AS ENUM (
    'open',
    'investigating',
    'mitigated',
    'closed'
);


ALTER TYPE public."RiskCaseStatus" OWNER TO aspera_dev;

--
-- Name: SellerStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."SellerStatus" AS ENUM (
    'draft',
    'submitted',
    'under_review',
    'approved',
    'rejected',
    'suspended'
);


ALTER TYPE public."SellerStatus" OWNER TO aspera_dev;

--
-- Name: SettlementStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."SettlementStatus" AS ENUM (
    'pending',
    'held',
    'released',
    'paid',
    'failed'
);


ALTER TYPE public."SettlementStatus" OWNER TO aspera_dev;

--
-- Name: TicketStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."TicketStatus" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE public."TicketStatus" OWNER TO aspera_dev;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: aspera_dev
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'suspended',
    'deleted'
);


ALTER TYPE public."UserStatus" OWNER TO aspera_dev;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO aspera_dev;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    actor_id text,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text,
    before_state jsonb,
    after_state jsonb,
    reason text,
    correlation_id text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO aspera_dev;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.brands (
    id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.brands OWNER TO aspera_dev;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.cart_items (
    id uuid NOT NULL,
    cart_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.cart_items OWNER TO aspera_dev;

--
-- Name: carts; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.carts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    status public."CartStatus" DEFAULT 'open'::public."CartStatus" NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.carts OWNER TO aspera_dev;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    parent_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO aspera_dev;

--
-- Name: checkout_sessions; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.checkout_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    cart_id uuid NOT NULL,
    address_id uuid NOT NULL,
    status public."CheckoutStatus" DEFAULT 'draft'::public."CheckoutStatus" NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    coupon_code text,
    snapshot jsonb NOT NULL,
    subtotal_paise integer NOT NULL,
    discount_paise integer DEFAULT 0 NOT NULL,
    shipping_paise integer DEFAULT 0 NOT NULL,
    tax_paise integer DEFAULT 0 NOT NULL,
    total_paise integer NOT NULL,
    reserved_until timestamp(6) with time zone,
    idempotency_key text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.checkout_sessions OWNER TO aspera_dev;

--
-- Name: commission_rules; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.commission_rules (
    id uuid NOT NULL,
    name text NOT NULL,
    rate_bps integer NOT NULL,
    seller_id uuid,
    active boolean DEFAULT true NOT NULL,
    description text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.commission_rules OWNER TO aspera_dev;

--
-- Name: compliance_evidence; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.compliance_evidence (
    id uuid NOT NULL,
    register_key text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    evidence_uri text,
    status public."ComplianceEvidenceStatus" DEFAULT 'draft'::public."ComplianceEvidenceStatus" NOT NULL,
    submitted_by_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.compliance_evidence OWNER TO aspera_dev;

--
-- Name: counterfeit_cases; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.counterfeit_cases (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    reporter_id uuid,
    brand_claim text NOT NULL,
    evidence_note text NOT NULL,
    status public."CounterfeitCaseStatus" DEFAULT 'reported'::public."CounterfeitCaseStatus" NOT NULL,
    status_reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    resolved_at timestamp(6) with time zone
);


ALTER TABLE public.counterfeit_cases OWNER TO aspera_dev;

--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.customer_addresses (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    label text DEFAULT 'Home'::text NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    line1 text NOT NULL,
    line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'IN'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.customer_addresses OWNER TO aspera_dev;

--
-- Name: disputes; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.disputes (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    reason text NOT NULL,
    status public."DisputeStatus" DEFAULT 'opened'::public."DisputeStatus" NOT NULL,
    resolution text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    resolved_at timestamp(6) with time zone
);


ALTER TABLE public.disputes OWNER TO aspera_dev;

--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.feature_flags (
    id uuid NOT NULL,
    key text NOT NULL,
    description text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    payload jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.feature_flags OWNER TO aspera_dev;

--
-- Name: idempotency_records; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.idempotency_records (
    id uuid NOT NULL,
    key text NOT NULL,
    scope text NOT NULL,
    request_hash text NOT NULL,
    response_code text,
    response_body jsonb,
    status text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone
);


ALTER TABLE public.idempotency_records OWNER TO aspera_dev;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.inventory_items (
    id uuid NOT NULL,
    variant_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    on_hand integer DEFAULT 0 NOT NULL,
    reserved integer DEFAULT 0 NOT NULL,
    damaged integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.inventory_items OWNER TO aspera_dev;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    invoice_number text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'draft'::public."InvoiceStatus" NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    total_paise integer NOT NULL,
    document jsonb NOT NULL,
    storage_key text,
    issued_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.invoices OWNER TO aspera_dev;

--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.journal_entries (
    id uuid NOT NULL,
    entry_number text NOT NULL,
    status public."JournalEntryStatus" DEFAULT 'draft'::public."JournalEntryStatus" NOT NULL,
    memo text NOT NULL,
    correlation_id text NOT NULL,
    order_id uuid,
    seller_id uuid,
    source_event text NOT NULL,
    posted_at timestamp(6) with time zone,
    reversed_entry_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.journal_entries OWNER TO aspera_dev;

--
-- Name: journal_lines; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.journal_lines (
    id uuid NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid NOT NULL,
    debit_paise integer DEFAULT 0 NOT NULL,
    credit_paise integer DEFAULT 0 NOT NULL,
    seller_id uuid,
    order_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.journal_lines OWNER TO aspera_dev;

--
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.kyc_documents (
    id uuid NOT NULL,
    seller_id uuid NOT NULL,
    kyc_case_id uuid NOT NULL,
    document_type text NOT NULL,
    storage_key text NOT NULL,
    file_name text NOT NULL,
    content_type text NOT NULL,
    byte_size integer NOT NULL,
    checksum_sha256 text NOT NULL,
    uploaded_by_user_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.kyc_documents OWNER TO aspera_dev;

--
-- Name: ledger_accounts; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.ledger_accounts (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    account_type public."LedgerAccountType" NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.ledger_accounts OWNER TO aspera_dev;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.login_attempts (
    id uuid NOT NULL,
    email text NOT NULL,
    success boolean NOT NULL,
    ip_address text,
    user_agent text,
    reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO aspera_dev;

--
-- Name: notification_messages; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.notification_messages (
    id uuid NOT NULL,
    channel text NOT NULL,
    recipient text NOT NULL,
    template_key text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    provider_ref text,
    error_message text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at timestamp(6) with time zone
);


ALTER TABLE public.notification_messages OWNER TO aspera_dev;

--
-- Name: order_fulfilment_groups; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.order_fulfilment_groups (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    status public."FulfilmentGroupStatus" DEFAULT 'pending'::public."FulfilmentGroupStatus" NOT NULL,
    line_total_paise integer NOT NULL,
    shipping_paise integer DEFAULT 0 NOT NULL,
    status_reason text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    cancelled_at timestamp(6) with time zone,
    carrier text,
    delivered_at timestamp(6) with time zone,
    shipped_at timestamp(6) with time zone,
    tracking_number text,
    tracking_url text
);


ALTER TABLE public.order_fulfilment_groups OWNER TO aspera_dev;

--
-- Name: order_lines; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.order_lines (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    fulfilment_group_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid NOT NULL,
    product_title text NOT NULL,
    variant_title text NOT NULL,
    sku text NOT NULL,
    quantity integer NOT NULL,
    unit_price_paise integer NOT NULL,
    line_total_paise integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.order_lines OWNER TO aspera_dev;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    order_number text NOT NULL,
    user_id uuid NOT NULL,
    checkout_session_id uuid NOT NULL,
    address_id uuid NOT NULL,
    status public."OrderStatus" NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    snapshot jsonb NOT NULL,
    subtotal_paise integer NOT NULL,
    discount_paise integer DEFAULT 0 NOT NULL,
    shipping_paise integer DEFAULT 0 NOT NULL,
    tax_paise integer DEFAULT 0 NOT NULL,
    total_paise integer NOT NULL,
    status_reason text,
    paid_at timestamp(6) with time zone,
    cancelled_at timestamp(6) with time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.orders OWNER TO aspera_dev;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.outbox_events (
    id uuid NOT NULL,
    event_type text NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    available_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_at timestamp(6) with time zone,
    last_error text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.outbox_events OWNER TO aspera_dev;

--
-- Name: payment_attempts; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.payment_attempts (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider text DEFAULT 'mock'::text NOT NULL,
    provider_reference text NOT NULL,
    status public."PaymentAttemptStatus" NOT NULL,
    amount_paise integer NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    client_secret text,
    failure_reason text,
    idempotency_key text NOT NULL,
    raw_create_response jsonb,
    paid_at timestamp(6) with time zone,
    failed_at timestamp(6) with time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.payment_attempts OWNER TO aspera_dev;

--
-- Name: payment_webhook_events; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.payment_webhook_events (
    id uuid NOT NULL,
    provider text NOT NULL,
    provider_event_id text NOT NULL,
    payment_attempt_id uuid,
    event_type text NOT NULL,
    payload_hash text NOT NULL,
    signature_valid boolean NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    processing_error text,
    raw_payload jsonb NOT NULL,
    received_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(6) with time zone
);


ALTER TABLE public.payment_webhook_events OWNER TO aspera_dev;

--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.platform_settings (
    id uuid NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.platform_settings OWNER TO aspera_dev;

--
-- Name: privacy_requests; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.privacy_requests (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    request_type text NOT NULL,
    details text NOT NULL,
    status public."PrivacyRequestStatus" DEFAULT 'received'::public."PrivacyRequestStatus" NOT NULL,
    status_reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    completed_at timestamp(6) with time zone
);


ALTER TABLE public.privacy_requests OWNER TO aspera_dev;

--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.product_reviews (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    rating integer NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    status public."ReviewModerationStatus" DEFAULT 'pending'::public."ReviewModerationStatus" NOT NULL,
    status_reason text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.product_reviews OWNER TO aspera_dev;

--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.product_variants (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    sku text NOT NULL,
    title text NOT NULL,
    option_values jsonb,
    mrp_paise integer NOT NULL,
    selling_price_paise integer NOT NULL,
    currency_code text DEFAULT 'INR'::text NOT NULL,
    weight_grams integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.product_variants OWNER TO aspera_dev;

--
-- Name: products; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.products (
    id uuid NOT NULL,
    seller_id uuid NOT NULL,
    category_id uuid NOT NULL,
    brand_id uuid,
    slug text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    description text NOT NULL,
    status public."ProductStatus" NOT NULL,
    status_reason text,
    country_of_origin text,
    hsn_code text,
    attributes jsonb,
    search_document text DEFAULT ''::text NOT NULL,
    submitted_at timestamp(6) with time zone,
    reviewed_at timestamp(6) with time zone,
    reviewed_by_user_id uuid,
    published_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.products OWNER TO aspera_dev;

--
-- Name: reconciliation_exceptions; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.reconciliation_exceptions (
    id uuid NOT NULL,
    kind text NOT NULL,
    reference text NOT NULL,
    description text NOT NULL,
    amount_paise integer,
    status public."ReconciliationStatus" DEFAULT 'open'::public."ReconciliationStatus" NOT NULL,
    resolution text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    resolved_at timestamp(6) with time zone
);


ALTER TABLE public.reconciliation_exceptions OWNER TO aspera_dev;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.refunds (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    return_request_id uuid,
    amount_paise integer NOT NULL,
    status public."RefundStatus" DEFAULT 'pending'::public."RefundStatus" NOT NULL,
    provider text DEFAULT 'mock'::text NOT NULL,
    provider_reference text,
    reason text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    completed_at timestamp(6) with time zone
);


ALTER TABLE public.refunds OWNER TO aspera_dev;

--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.return_requests (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    status public."ReturnStatus" DEFAULT 'requested'::public."ReturnStatus" NOT NULL,
    reason text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    order_line_id uuid,
    status_reason text,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.return_requests OWNER TO aspera_dev;

--
-- Name: risk_cases; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.risk_cases (
    id uuid NOT NULL,
    subject_type text NOT NULL,
    subject_id text NOT NULL,
    severity text DEFAULT 'medium'::text NOT NULL,
    title text NOT NULL,
    details text NOT NULL,
    status public."RiskCaseStatus" DEFAULT 'open'::public."RiskCaseStatus" NOT NULL,
    status_reason text,
    opened_by_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    closed_at timestamp(6) with time zone
);


ALTER TABLE public.risk_cases OWNER TO aspera_dev;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO aspera_dev;

--
-- Name: seller_kyc_cases; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.seller_kyc_cases (
    id uuid NOT NULL,
    seller_id uuid NOT NULL,
    stage public."KycStage" NOT NULL,
    status public."KycCaseStatus" NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.seller_kyc_cases OWNER TO aspera_dev;

--
-- Name: sellers; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.sellers (
    id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    legal_name text NOT NULL,
    trade_name text,
    status public."SellerStatus" NOT NULL,
    status_reason text,
    contact_email text NOT NULL,
    contact_phone text,
    pan_last4 text,
    gstin_masked text,
    registered_state text,
    agreement_accepted_at timestamp(6) with time zone,
    submitted_at timestamp(6) with time zone,
    reviewed_at timestamp(6) with time zone,
    reviewed_by_user_id uuid,
    approved_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.sellers OWNER TO aspera_dev;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked_at timestamp(6) with time zone,
    ip_address text,
    user_agent text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sessions OWNER TO aspera_dev;

--
-- Name: settlement_batches; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.settlement_batches (
    id uuid NOT NULL,
    batch_number text NOT NULL,
    seller_id uuid NOT NULL,
    status public."SettlementStatus" DEFAULT 'pending'::public."SettlementStatus" NOT NULL,
    period_start timestamp(6) with time zone NOT NULL,
    period_end timestamp(6) with time zone NOT NULL,
    gross_paise integer NOT NULL,
    commission_paise integer NOT NULL,
    net_paise integer NOT NULL,
    hold_reason text,
    released_at timestamp(6) with time zone,
    paid_at timestamp(6) with time zone,
    version integer DEFAULT 1 NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.settlement_batches OWNER TO aspera_dev;

--
-- Name: settlement_lines; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.settlement_lines (
    id uuid NOT NULL,
    batch_id uuid NOT NULL,
    order_id uuid NOT NULL,
    fulfilment_group_id uuid NOT NULL,
    gross_paise integer NOT NULL,
    commission_paise integer NOT NULL,
    net_paise integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.settlement_lines OWNER TO aspera_dev;

--
-- Name: shipments; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.shipments (
    id uuid NOT NULL,
    fulfilment_group_id uuid NOT NULL,
    carrier text NOT NULL,
    tracking_number text NOT NULL,
    tracking_url text,
    label_storage_key text,
    status text DEFAULT 'created'::text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.shipments OWNER TO aspera_dev;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.stock_movements (
    id uuid NOT NULL,
    inventory_item_id uuid NOT NULL,
    movement_type text NOT NULL,
    quantity integer NOT NULL,
    reason text NOT NULL,
    actor_id text,
    correlation_id text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.stock_movements OWNER TO aspera_dev;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.support_tickets (
    id uuid NOT NULL,
    order_id uuid,
    user_id uuid NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    status public."TicketStatus" DEFAULT 'open'::public."TicketStatus" NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    resolved_at timestamp(6) with time zone
);


ALTER TABLE public.support_tickets OWNER TO aspera_dev;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.user_roles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    scope_key text DEFAULT 'global'::text NOT NULL,
    seller_id uuid,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO aspera_dev;

--
-- Name: users; Type: TABLE; Schema: public; Owner: aspera_dev
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    email_verified_at timestamp(6) with time zone,
    password_hash text NOT NULL,
    display_name text NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone
);


ALTER TABLE public.users OWNER TO aspera_dev;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: checkout_sessions checkout_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_pkey PRIMARY KEY (id);


--
-- Name: commission_rules commission_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT commission_rules_pkey PRIMARY KEY (id);


--
-- Name: compliance_evidence compliance_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.compliance_evidence
    ADD CONSTRAINT compliance_evidence_pkey PRIMARY KEY (id);


--
-- Name: counterfeit_cases counterfeit_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.counterfeit_cases
    ADD CONSTRAINT counterfeit_cases_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: disputes disputes_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: idempotency_records idempotency_records_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.idempotency_records
    ADD CONSTRAINT idempotency_records_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_lines journal_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: ledger_accounts ledger_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.ledger_accounts
    ADD CONSTRAINT ledger_accounts_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: notification_messages notification_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.notification_messages
    ADD CONSTRAINT notification_messages_pkey PRIMARY KEY (id);


--
-- Name: order_fulfilment_groups order_fulfilment_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_fulfilment_groups
    ADD CONSTRAINT order_fulfilment_groups_pkey PRIMARY KEY (id);


--
-- Name: order_lines order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: payment_attempts payment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.payment_attempts
    ADD CONSTRAINT payment_attempts_pkey PRIMARY KEY (id);


--
-- Name: payment_webhook_events payment_webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_pkey PRIMARY KEY (id);


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- Name: privacy_requests privacy_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.privacy_requests
    ADD CONSTRAINT privacy_requests_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_exceptions reconciliation_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_pkey PRIMARY KEY (id);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- Name: risk_cases risk_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.risk_cases
    ADD CONSTRAINT risk_cases_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: seller_kyc_cases seller_kyc_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.seller_kyc_cases
    ADD CONSTRAINT seller_kyc_cases_pkey PRIMARY KEY (id);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settlement_batches settlement_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.settlement_batches
    ADD CONSTRAINT settlement_batches_pkey PRIMARY KEY (id);


--
-- Name: settlement_lines settlement_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.settlement_lines
    ADD CONSTRAINT settlement_lines_pkey PRIMARY KEY (id);


--
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_correlation_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX audit_logs_correlation_id_idx ON public.audit_logs USING btree (correlation_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: brands_slug_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);


--
-- Name: cart_items_cart_id_variant_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX cart_items_cart_id_variant_id_key ON public.cart_items USING btree (cart_id, variant_id);


--
-- Name: cart_items_variant_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX cart_items_variant_id_idx ON public.cart_items USING btree (variant_id);


--
-- Name: carts_user_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX carts_user_id_status_idx ON public.carts USING btree (user_id, status);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: checkout_sessions_cart_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX checkout_sessions_cart_id_idx ON public.checkout_sessions USING btree (cart_id);


--
-- Name: checkout_sessions_idempotency_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX checkout_sessions_idempotency_key_key ON public.checkout_sessions USING btree (idempotency_key);


--
-- Name: checkout_sessions_user_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX checkout_sessions_user_id_status_idx ON public.checkout_sessions USING btree (user_id, status);


--
-- Name: commission_rules_seller_id_active_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX commission_rules_seller_id_active_idx ON public.commission_rules USING btree (seller_id, active);


--
-- Name: compliance_evidence_register_key_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX compliance_evidence_register_key_status_idx ON public.compliance_evidence USING btree (register_key, status);


--
-- Name: counterfeit_cases_product_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX counterfeit_cases_product_id_idx ON public.counterfeit_cases USING btree (product_id);


--
-- Name: counterfeit_cases_seller_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX counterfeit_cases_seller_id_status_idx ON public.counterfeit_cases USING btree (seller_id, status);


--
-- Name: counterfeit_cases_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX counterfeit_cases_status_idx ON public.counterfeit_cases USING btree (status);


--
-- Name: customer_addresses_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX customer_addresses_user_id_idx ON public.customer_addresses USING btree (user_id);


--
-- Name: disputes_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX disputes_order_id_idx ON public.disputes USING btree (order_id);


--
-- Name: disputes_seller_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX disputes_seller_id_status_idx ON public.disputes USING btree (seller_id, status);


--
-- Name: feature_flags_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX feature_flags_key_key ON public.feature_flags USING btree (key);


--
-- Name: idempotency_records_expires_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX idempotency_records_expires_at_idx ON public.idempotency_records USING btree (expires_at);


--
-- Name: idempotency_records_key_scope_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX idempotency_records_key_scope_key ON public.idempotency_records USING btree (key, scope);


--
-- Name: inventory_items_variant_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX inventory_items_variant_id_key ON public.inventory_items USING btree (variant_id);


--
-- Name: invoices_invoice_number_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX invoices_invoice_number_key ON public.invoices USING btree (invoice_number);


--
-- Name: invoices_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX invoices_order_id_idx ON public.invoices USING btree (order_id);


--
-- Name: journal_entries_entry_number_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX journal_entries_entry_number_key ON public.journal_entries USING btree (entry_number);


--
-- Name: journal_entries_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX journal_entries_order_id_idx ON public.journal_entries USING btree (order_id);


--
-- Name: journal_entries_reversed_entry_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX journal_entries_reversed_entry_id_key ON public.journal_entries USING btree (reversed_entry_id);


--
-- Name: journal_entries_seller_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX journal_entries_seller_id_idx ON public.journal_entries USING btree (seller_id);


--
-- Name: journal_entries_status_posted_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX journal_entries_status_posted_at_idx ON public.journal_entries USING btree (status, posted_at);


--
-- Name: journal_lines_account_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX journal_lines_account_id_idx ON public.journal_lines USING btree (account_id);


--
-- Name: journal_lines_journal_entry_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX journal_lines_journal_entry_id_idx ON public.journal_lines USING btree (journal_entry_id);


--
-- Name: kyc_documents_seller_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX kyc_documents_seller_id_idx ON public.kyc_documents USING btree (seller_id);


--
-- Name: ledger_accounts_code_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX ledger_accounts_code_key ON public.ledger_accounts USING btree (code);


--
-- Name: login_attempts_email_created_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX login_attempts_email_created_at_idx ON public.login_attempts USING btree (email, created_at);


--
-- Name: notification_messages_status_created_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX notification_messages_status_created_at_idx ON public.notification_messages USING btree (status, created_at);


--
-- Name: order_fulfilment_groups_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX order_fulfilment_groups_order_id_idx ON public.order_fulfilment_groups USING btree (order_id);


--
-- Name: order_fulfilment_groups_seller_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX order_fulfilment_groups_seller_id_status_idx ON public.order_fulfilment_groups USING btree (seller_id, status);


--
-- Name: order_lines_fulfilment_group_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX order_lines_fulfilment_group_id_idx ON public.order_lines USING btree (fulfilment_group_id);


--
-- Name: order_lines_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX order_lines_order_id_idx ON public.order_lines USING btree (order_id);


--
-- Name: orders_checkout_session_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX orders_checkout_session_id_key ON public.orders USING btree (checkout_session_id);


--
-- Name: orders_order_number_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);


--
-- Name: orders_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX orders_status_idx ON public.orders USING btree (status);


--
-- Name: orders_user_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX orders_user_id_status_idx ON public.orders USING btree (user_id, status);


--
-- Name: outbox_events_status_available_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX outbox_events_status_available_at_idx ON public.outbox_events USING btree (status, available_at);


--
-- Name: payment_attempts_idempotency_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX payment_attempts_idempotency_key_key ON public.payment_attempts USING btree (idempotency_key);


--
-- Name: payment_attempts_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX payment_attempts_order_id_idx ON public.payment_attempts USING btree (order_id);


--
-- Name: payment_attempts_provider_reference_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX payment_attempts_provider_reference_key ON public.payment_attempts USING btree (provider_reference);


--
-- Name: payment_attempts_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX payment_attempts_status_idx ON public.payment_attempts USING btree (status);


--
-- Name: payment_attempts_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX payment_attempts_user_id_idx ON public.payment_attempts USING btree (user_id);


--
-- Name: payment_webhook_events_payment_attempt_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX payment_webhook_events_payment_attempt_id_idx ON public.payment_webhook_events USING btree (payment_attempt_id);


--
-- Name: payment_webhook_events_provider_provider_event_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX payment_webhook_events_provider_provider_event_id_key ON public.payment_webhook_events USING btree (provider, provider_event_id);


--
-- Name: platform_settings_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX platform_settings_key_key ON public.platform_settings USING btree (key);


--
-- Name: privacy_requests_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX privacy_requests_status_idx ON public.privacy_requests USING btree (status);


--
-- Name: privacy_requests_user_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX privacy_requests_user_id_status_idx ON public.privacy_requests USING btree (user_id, status);


--
-- Name: product_reviews_product_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX product_reviews_product_id_status_idx ON public.product_reviews USING btree (product_id, status);


--
-- Name: product_reviews_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX product_reviews_status_idx ON public.product_reviews USING btree (status);


--
-- Name: product_reviews_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX product_reviews_user_id_idx ON public.product_reviews USING btree (user_id);


--
-- Name: product_variants_product_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX product_variants_product_id_idx ON public.product_variants USING btree (product_id);


--
-- Name: product_variants_sku_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX products_category_id_idx ON public.products USING btree (category_id);


--
-- Name: products_search_document_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX products_search_document_idx ON public.products USING gin (to_tsvector('english'::regconfig, search_document));


--
-- Name: products_seller_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX products_seller_id_idx ON public.products USING btree (seller_id);


--
-- Name: products_slug_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);


--
-- Name: products_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX products_status_idx ON public.products USING btree (status);


--
-- Name: reconciliation_exceptions_status_kind_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX reconciliation_exceptions_status_kind_idx ON public.reconciliation_exceptions USING btree (status, kind);


--
-- Name: refunds_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX refunds_order_id_idx ON public.refunds USING btree (order_id);


--
-- Name: refunds_return_request_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX refunds_return_request_id_key ON public.refunds USING btree (return_request_id);


--
-- Name: return_requests_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX return_requests_order_id_idx ON public.return_requests USING btree (order_id);


--
-- Name: return_requests_seller_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX return_requests_seller_id_status_idx ON public.return_requests USING btree (seller_id, status);


--
-- Name: return_requests_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX return_requests_user_id_idx ON public.return_requests USING btree (user_id);


--
-- Name: risk_cases_status_severity_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX risk_cases_status_severity_idx ON public.risk_cases USING btree (status, severity);


--
-- Name: risk_cases_subject_type_subject_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX risk_cases_subject_type_subject_id_idx ON public.risk_cases USING btree (subject_type, subject_id);


--
-- Name: roles_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX roles_key_key ON public.roles USING btree (key);


--
-- Name: seller_kyc_cases_seller_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX seller_kyc_cases_seller_id_idx ON public.seller_kyc_cases USING btree (seller_id);


--
-- Name: sellers_owner_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX sellers_owner_user_id_idx ON public.sellers USING btree (owner_user_id);


--
-- Name: sellers_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX sellers_status_idx ON public.sellers USING btree (status);


--
-- Name: sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX sessions_expires_at_idx ON public.sessions USING btree (expires_at);


--
-- Name: sessions_token_hash_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX sessions_token_hash_key ON public.sessions USING btree (token_hash);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: settlement_batches_batch_number_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX settlement_batches_batch_number_key ON public.settlement_batches USING btree (batch_number);


--
-- Name: settlement_batches_seller_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX settlement_batches_seller_id_status_idx ON public.settlement_batches USING btree (seller_id, status);


--
-- Name: settlement_lines_batch_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX settlement_lines_batch_id_idx ON public.settlement_lines USING btree (batch_id);


--
-- Name: settlement_lines_fulfilment_group_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX settlement_lines_fulfilment_group_id_key ON public.settlement_lines USING btree (fulfilment_group_id);


--
-- Name: settlement_lines_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX settlement_lines_order_id_idx ON public.settlement_lines USING btree (order_id);


--
-- Name: shipments_fulfilment_group_id_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX shipments_fulfilment_group_id_key ON public.shipments USING btree (fulfilment_group_id);


--
-- Name: stock_movements_inventory_item_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX stock_movements_inventory_item_id_idx ON public.stock_movements USING btree (inventory_item_id);


--
-- Name: support_tickets_order_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX support_tickets_order_id_idx ON public.support_tickets USING btree (order_id);


--
-- Name: support_tickets_user_id_status_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX support_tickets_user_id_status_idx ON public.support_tickets USING btree (user_id, status);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


--
-- Name: user_roles_user_id_role_id_scope_key_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX user_roles_user_id_role_id_scope_key_key ON public.user_roles USING btree (user_id, role_id, scope_key);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: aspera_dev
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: checkout_sessions checkout_sessions_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.customer_addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: checkout_sessions checkout_sessions_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: checkout_sessions checkout_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.checkout_sessions
    ADD CONSTRAINT checkout_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: customer_addresses customer_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: disputes disputes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.disputes
    ADD CONSTRAINT disputes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_items inventory_items_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_items inventory_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: invoices invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: journal_entries journal_entries_reversed_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_reversed_entry_id_fkey FOREIGN KEY (reversed_entry_id) REFERENCES public.journal_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: journal_lines journal_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.ledger_accounts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: journal_lines journal_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.journal_lines
    ADD CONSTRAINT journal_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kyc_documents kyc_documents_kyc_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_kyc_case_id_fkey FOREIGN KEY (kyc_case_id) REFERENCES public.seller_kyc_cases(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kyc_documents kyc_documents_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: kyc_documents kyc_documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_fulfilment_groups order_fulfilment_groups_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_fulfilment_groups
    ADD CONSTRAINT order_fulfilment_groups_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_fulfilment_groups order_fulfilment_groups_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_fulfilment_groups
    ADD CONSTRAINT order_fulfilment_groups_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines order_lines_fulfilment_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_fulfilment_group_id_fkey FOREIGN KEY (fulfilment_group_id) REFERENCES public.order_fulfilment_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_lines order_lines_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.customer_addresses(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_checkout_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_checkout_session_id_fkey FOREIGN KEY (checkout_session_id) REFERENCES public.checkout_sessions(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_attempts payment_attempts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.payment_attempts
    ADD CONSTRAINT payment_attempts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_attempts payment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.payment_attempts
    ADD CONSTRAINT payment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payment_webhook_events payment_webhook_events_payment_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT payment_webhook_events_payment_attempt_id_fkey FOREIGN KEY (payment_attempt_id) REFERENCES public.payment_attempts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_reviewed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refunds refunds_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refunds refunds_return_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_return_request_id_fkey FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: return_requests return_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT return_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: seller_kyc_cases seller_kyc_cases_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.seller_kyc_cases
    ADD CONSTRAINT seller_kyc_cases_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sellers sellers_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sellers sellers_reviewed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: settlement_lines settlement_lines_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.settlement_lines
    ADD CONSTRAINT settlement_lines_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.settlement_batches(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: settlement_lines settlement_lines_fulfilment_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.settlement_lines
    ADD CONSTRAINT settlement_lines_fulfilment_group_id_fkey FOREIGN KEY (fulfilment_group_id) REFERENCES public.order_fulfilment_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: shipments shipments_fulfilment_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_fulfilment_group_id_fkey FOREIGN KEY (fulfilment_group_id) REFERENCES public.order_fulfilment_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: stock_movements stock_movements_inventory_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: support_tickets support_tickets_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: aspera_dev
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict CDaGkNx8FQzykp293d4kkwApdLGGt1Vv3lba8faZbyAo7ubKJgOcMzgvRgn5jHA

