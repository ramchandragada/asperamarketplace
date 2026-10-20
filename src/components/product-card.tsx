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
      className="absolute top-2 right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-muted shadow-[var(--shadow-card)] backdrop-blur-sm transition hover:text-danger"
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
    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded-full bg-accent px-2 py-1 text-[10px] font-semibold tracking-wide text-accent-foreground shadow-sm">
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

  const priceLabel = formatPaise(product.minPricePaise);
  const offerLabel = discount ? `, ${discount}% off` : "";

  return (
    <article className="group relative flex h-full flex-col">
      <WishlistButton productId={product.id} />
      <Link
        href={`/products/${product.slug}`}
        className="flex h-full flex-col"
        aria-label={`${product.title}, ${priceLabel}${offerLabel}`}
      >
        <div className="photo-well relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
          {product.badge ? <BadgePill badge={product.badge} /> : null}
          {showImage ? (
            <Image
              src={product.primaryImageUrl as string}
              alt={product.primaryImageAlt ?? product.title}
              fill
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUzMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUzMyIgZmlsbD0iI2VmZTRkMiIvPjwvc3ZnPg=="
              className="card-photo object-cover object-center"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-4xl font-semibold text-accent/25"
                aria-hidden
              >
                {initials}
              </span>
              <span className="sr-only">{product.title}</span>
            </div>
          )}
          {discount ? (
            <span className="offer-chip absolute bottom-2 left-2 z-10 px-2 py-1 text-[11px]">
              {discount}% off
            </span>
          ) : null}
          {hasRating ? (
            <span className="absolute right-2 bottom-2 z-10 inline-flex items-center rounded-full bg-foreground/85 px-1.5 py-1 text-[11px] font-semibold text-white">
              {product.ratingAverage!.toFixed(1)} ★
            </span>
          ) : null}
          {!inStock ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-foreground/75 px-2 py-1 text-center text-xs text-background">
              Out of stock
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 px-0.5 pt-2.5 pb-1">
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-[18px] leading-6 font-bold tracking-tight text-foreground md:text-[20px]">
              {priceLabel}
            </span>
            {product.minMrpPaise &&
            product.minMrpPaise > product.minPricePaise ? (
              <span className="text-[12px] leading-[18px] text-muted line-through">
                {formatPaise(product.minMrpPaise)}
              </span>
            ) : null}
          </p>
          <h3 className="line-clamp-2 text-[13px] leading-[18px] font-medium text-foreground md:text-[14px] md:leading-5">
            {product.title}
          </h3>
          {hasRating ? (
            <p className="text-[11px] text-muted">
              {(product.reviewCount ?? 0) >= 1000
                ? `${((product.reviewCount ?? 0) / 1000).toFixed(1)}k reviews`
                : `${product.reviewCount} reviews`}
            </p>
          ) : null}
          {freeDelivery ? (
            <span className="text-[12px] font-medium text-success">
              Free delivery
            </span>
          ) : null}
          <p className="mt-auto pt-0.5 text-[12px] text-muted">
            {sellerLabel ? `${sellerLabel} · ` : ""}
            {product.sellerName}
          </p>
        </div>
      </Link>
    </article>
  );
}
