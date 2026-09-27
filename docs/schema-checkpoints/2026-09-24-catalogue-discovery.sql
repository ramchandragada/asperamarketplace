-- Schema checkpoint before catalogue and discovery migration.
-- Created: 2026-09-24
-- Non-production only. Do not apply to production.
-- Launch category remains an open business decision (A-26).
-- Seed data may use a generic category; that is not a launch-category choice.

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  status_reason TEXT,
  country_of_origin TEXT,
  hsn_code TEXT,
  attributes JSONB,
  search_document TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by_user_id UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products (seller_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products (category_id);
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);
CREATE INDEX IF NOT EXISTS products_search_document_idx ON products USING gin (to_tsvector('english', search_document));

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  option_values JSONB,
  mrp_paise INTEGER NOT NULL,
  selling_price_paise INTEGER NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  weight_grams INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_variants_price_check CHECK (selling_price_paise > 0 AND mrp_paise >= selling_price_paise)
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON product_variants (product_id);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  on_hand INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  damaged INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_items_qty_check CHECK (on_hand >= 0 AND reserved >= 0 AND damaged >= 0 AND on_hand >= reserved)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  actor_id TEXT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_inventory_item_id_idx ON stock_movements (inventory_item_id);
