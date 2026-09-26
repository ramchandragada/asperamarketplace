-- PostgreSQL full-text search support for approved product discovery.
CREATE INDEX IF NOT EXISTS products_search_document_idx
  ON "public"."products"
  USING gin (to_tsvector('english', "search_document"));
