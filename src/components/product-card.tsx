"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useSyncExternalStore, type MouseEvent } from "react";
import {
  discountPercent,
  formatPaise,
  type ProductCardBadge,
} from "@/modules/catalogue/helpers";
import { sellerStorefrontLabelText } from "@/modules/catalogue/claims";
import { SHIPPING_POLICY } from "@/modules/cart/pricing";

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
  deliveryFeePaise?: number | null;
  deliveryOriginalPaise?: number | null;
  /** Ignored — fake countdowns are not rendered without a real campaign model */
  dealEndsAt?: string | null;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  variantCount?: number;
  badge?: ProductCardBadge | null;
};

export { discountPercent };

function subscribeWishlist(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("aspera-wishlist", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("aspera-wishlist", onStoreChange);
  };
}

function getWishlistSnapshot() {
  try {
    return localStorage.getItem("aspera.wishlist") ?? "[]";
  } catch {
    return "[]";
  }
}

function WishlistButton({ productId }: { productId: string }) {
  const raw = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    () => "[]",
  );
  const ids = (() => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [] as string[];
    }
  })();
  const saved = ids.includes(productId);

  function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const next = saved
      ? ids.filter((id) => id !== productId)
      : [...ids, productId];
    try {
      localStorage.setItem("aspera.wishlist", JSON.stringify(next));
      window.dispatchEvent(new Event("aspera-wishlist"));
    } catch {
      /* ignore */
    }
    void import("@/components/toast-host").then(({ showToast }) => {
      showToast(saved ? "Removed from wishlist" : "Added to wishlist");
    });
    void fetch("/api/wishlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId,
        action: saved ? "remove" : "add",
      }),
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/95 text-muted shadow-sm transition hover:text-danger"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          d="M12 20s-7-4.35-7-9.2A3.8 3.8 0 0112 7.5a3.8 3.8 0 017 3.3C19 15.65 12 20 12 20z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          className={saved ? "text-danger" : undefined}
        />
      </svg>
    </button>
  );
}

const BADGE_LABELS: Record<ProductCardBadge, string> = {
  new: "New",
  "best-value": "Best value",
  "free-delivery": "Free delivery",
  "low-stock": "Low stock",
  featured: "Featured",
};

function BadgePill({ badge }: { badge: ProductCardBadge }) {
  return (
    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-foreground shadow-sm">
      {BADGE_LABELS[badge]}
    </span>
  );
}

export function ProductCard({ product }: { product: ProductCardModel }) {
  const discount =
    product.minMrpPaise != null
      ? discountPercent(product.minMrpPaise, product.minPricePaise)
      : null;
  const inStock = product.availableQty > 0;
  const initials = product.title.slice(0, 1).toUpperCase();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(product.primaryImageUrl) && !imageFailed;
  const freeDelivery =
    product.freeDeliveryHint === true ||
    product.minPricePaise >= SHIPPING_POLICY.freeAbovePaise;
  const hasRating =
    product.ratingAverage != null && (product.reviewCount ?? 0) > 0;
  const sellerLabel = product.sellerVerified
    ? sellerStorefrontLabelText("approved_seller")
    : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <Link
        href={`/products/${product.slug}`}
        className="flex h-full flex-col"
        aria-label={`${product.title}, ${formatPaise(product.minPricePaise)}`}
      >
        <div className="relative aspect-square overflow-hidden bg-accent-soft md:aspect-square">
          {product.badge ? <BadgePill badge={product.badge} /> : null}
          <WishlistButton productId={product.id} />
          {showImage ? (
            <Image
              src={product.primaryImageUrl as string}
              alt={product.primaryImageAlt ?? product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 224px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U4ZWVmMCIvPjwvc3ZnPg=="
              className="object-contain p-2"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-accent-soft">
              <span
                className="text-4xl font-semibold text-accent/25"
                aria-hidden
              >
                {initials}
              </span>
              <span className="sr-only">{product.title}</span>
            </div>
          )}
          {!inStock ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-foreground/70 px-2 py-1 text-center text-xs text-background">
              Out of stock
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
          <h3 className="line-clamp-2 text-[15px] leading-[21px] font-semibold text-foreground">
            {product.title}
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[20px] leading-[26px] font-bold text-foreground">
              {formatPaise(product.minPricePaise)}
            </span>
            {product.minMrpPaise &&
            product.minMrpPaise > product.minPricePaise ? (
              <span className="text-[12px] leading-[18px] text-muted line-through">
                {formatPaise(product.minMrpPaise)}
              </span>
            ) : null}
            {discount ? (
              <span className="text-[12px] leading-[18px] font-semibold text-success">
                {discount}% off
              </span>
            ) : null}
          </p>
          {hasRating ? (
            <p className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded bg-success px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {product.ratingAverage!.toFixed(1)} ★
              </span>
              <span className="text-[11px] text-muted">
                {(product.reviewCount ?? 0) >= 1000
                  ? `${((product.reviewCount ?? 0) / 1000).toFixed(1)}k Reviews`
                  : `${product.reviewCount} Reviews`}
              </span>
            </p>
          ) : null}
          {freeDelivery ? (
            <span className="text-[12px] font-medium text-success">
              Free delivery on eligible orders
            </span>
          ) : (
            <p className="text-[12px] text-muted">
              Delivery calculated at checkout
            </p>
          )}
          <p className="mt-auto pt-1 text-[12px] text-muted">
            {sellerLabel ? `${sellerLabel} · ` : ""}
            {product.sellerName}
          </p>
        </div>
      </Link>
    </article>
  );
}
