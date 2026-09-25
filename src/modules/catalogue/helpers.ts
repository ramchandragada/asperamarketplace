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

export type ProductCardBadge = "original" | "mall";

/** Meesho-style card badge: house brand vs premium mall brands. */
export function resolveProductBadge(input: {
  brandSlug?: string | null;
  brandName?: string | null;
  sellerVerified?: boolean;
}): ProductCardBadge | null {
  const slug = (input.brandSlug ?? "").toLowerCase();
  const name = (input.brandName ?? "").toLowerCase();
  if (slug.startsWith("aspera") || name.includes("aspera")) {
    return "original";
  }
  if (input.sellerVerified && (slug || name)) {
    return "mall";
  }
  return null;
}
