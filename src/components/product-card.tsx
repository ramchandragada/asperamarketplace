import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPaise } from "@/modules/catalogue/helpers";

export type ProductCardModel = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  categoryName?: string;
  sellerName: string;
  sellerVerified?: boolean;
  minPricePaise: number;
  minMrpPaise?: number | null;
  availableQty: number;
  ratingAverage?: number | null;
  reviewCount?: number;
  freeDeliveryHint?: boolean;
};

export function discountPercent(mrp: number, price: number) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function ProductCard({ product }: { product: ProductCardModel }) {
  const discount =
    product.minMrpPaise != null
      ? discountPercent(product.minMrpPaise, product.minPricePaise)
      : null;
  const inStock = product.availableQty > 0;
  const initials = product.title.slice(0, 1).toUpperCase();

  return (
    <Card as="article" className="group flex h-full flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-[4/5] bg-gradient-to-br from-accent-soft via-surface-raised to-warning-soft/40">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-semibold text-accent/30" aria-hidden>
              {initials}
            </span>
          </div>
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {product.sellerVerified ? (
              <Badge tone="success">Verified seller</Badge>
            ) : null}
            {discount ? <Badge tone="warning">{discount}% off</Badge> : null}
          </div>
          {!inStock ? (
            <div className="absolute inset-x-0 bottom-0 bg-foreground/70 px-2 py-1 text-center text-xs text-background">
              Out of stock
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          {product.categoryName ? (
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              {product.categoryName}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 group-hover:underline">
            {product.title}
          </h3>
          <p className="text-sm">
            <span className="font-semibold">{formatPaise(product.minPricePaise)}</span>
            {product.minMrpPaise && product.minMrpPaise > product.minPricePaise ? (
              <span className="ml-2 text-xs text-muted line-through">
                {formatPaise(product.minMrpPaise)}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted">
            {product.sellerName}
            {product.ratingAverage != null && (product.reviewCount ?? 0) > 0
              ? ` · ${product.ratingAverage.toFixed(1)}★ (${product.reviewCount})`
              : ""}
          </p>
          <p className="mt-auto pt-1 text-xs text-muted">
            {product.freeDeliveryHint ? "Delivery estimate on checkout" : "Delivery shown at checkout"}
            {inStock ? " · In stock" : ""}
          </p>
        </div>
      </Link>
    </Card>
  );
}
