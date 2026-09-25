import { ProductStatus } from "@prisma/client";

const ALLOWED: Record<ProductStatus, ProductStatus[]> = {
  draft: ["submitted", "archived"],
  submitted: ["approved", "rejected"],
  approved: ["archived"],
  rejected: ["draft", "submitted", "archived"],
  archived: [],
};

export function canTransitionProductStatus(
  from: ProductStatus,
  to: ProductStatus,
): boolean {
  return ALLOWED[from].includes(to);
}

export function assertProductTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  if (!canTransitionProductStatus(from, to)) {
    throw new ProductTransitionError(
      `Product status cannot move from ${from} to ${to}`,
    );
  }
}

export class ProductTransitionError extends Error {
  readonly code = "INVALID_TRANSITION";

  constructor(message: string) {
    super(message);
    this.name = "ProductTransitionError";
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildSearchDocument(input: {
  title: string;
  summary: string;
  description: string;
  brandName?: string | null;
  categoryName?: string | null;
  sku?: string | null;
}): string {
  return [
    input.title,
    input.summary,
    input.description,
    input.brandName,
    input.categoryName,
    input.sku,
  ]
    .filter(Boolean)
    .join(" ");
}

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function discountPercent(mrp: number, price: number) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export type ProductCardBadge =
  | "new"
  | "best-value"
  | "free-delivery"
  | "low-stock"
  | "featured";

/**
 * Real-state badges only. No Mall / Aspera Original / Verified claims
 * without a documented programme.
 */
export function resolveProductBadge(input: {
  brandSlug?: string | null;
  brandName?: string | null;
  sellerVerified?: boolean;
  availableQty?: number | null;
  createdAt?: Date | string | null;
  freeDelivery?: boolean;
  discountPercent?: number | null;
  featured?: boolean;
}): ProductCardBadge | null {
  if (input.featured) return "featured";
  if (
    input.availableQty != null &&
    input.availableQty > 0 &&
    input.availableQty <= 5
  ) {
    return "low-stock";
  }
  if (input.freeDelivery) return "free-delivery";
  if (input.discountPercent != null && input.discountPercent >= 30) {
    return "best-value";
  }
  if (input.createdAt) {
    const created =
      input.createdAt instanceof Date
        ? input.createdAt
        : new Date(input.createdAt);
    const ageMs = Date.now() - created.getTime();
    if (!Number.isNaN(ageMs) && ageMs >= 0 && ageMs < 14 * 24 * 60 * 60 * 1000) {
      return "new";
    }
  }
  return null;
}
