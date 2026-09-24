-- Schema checkpoint before identity and seller onboarding migration.
-- Created: 2026-09-24
-- Environment: non-production only. Do not apply to production.
-- Applied migration will live under prisma/migrations.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  scope_key TEXT NOT NULL DEFAULT 'global',
  seller_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_role_scope_key UNIQUE (user_id, role_id, scope_key)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_attempts_email_created_at_idx ON login_attempts (email, created_at);

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  status TEXT NOT NULL,
  status_reason TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  pan_last4 TEXT,
  gstin_masked TEXT,
  registered_state TEXT,
  agreement_accepted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS sellers_status_idx ON sellers (status);
CREATE INDEX IF NOT EXISTS sellers_owner_user_id_idx ON sellers (owner_user_id);

CREATE TABLE IF NOT EXISTS seller_kyc_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seller_kyc_cases_seller_id_idx ON seller_kyc_cases (seller_id);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  kyc_case_id UUID NOT NULL REFERENCES seller_kyc_cases(id),
  document_type TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kyc_documents_seller_id_idx ON kyc_documents (seller_id);
