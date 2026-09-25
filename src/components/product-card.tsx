"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type MouseEvent } from "react";
import {
  discountPercent,
  formatPaise,
  type ProductCardBadge,
} from "@/modules/catalogue/helpers";

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
  dealEndsAt?: string | null;
  primaryImageUrl?: string | null;
  primaryImageAlt?: string | null;
  variantCount?: number;
  badge?: ProductCardBadge | null;
};

export { discountPercent };

function formatCountdown(end: number) {
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${String(hours).padStart(2, "0")}h:${String(minutes).padStart(2, "0")}m:${String(seconds).padStart(2, "0")}s`;
}

function useCountdown(iso: string | null | undefined) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const end = iso ? new Date(iso).getTime() : Number.NaN;

    const tick = () => {
      if (cancelled) return;
      if (!iso || Number.isNaN(end)) {
        setLabel(null);
        return;
      }
      setLabel(formatCountdown(end));
    };

    const frame = window.requestAnimationFrame(tick);
    const id = window.setInterval(tick, 1000);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearInterval(id);
    };
  }, [iso]);

  return label;
}

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
      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-muted shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-danger"
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

function BadgePill({ badge }: { badge: ProductCardBadge }) {
  if (badge === "original") {
    return (
      <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded bg-[#1a5c5c] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
        Aspera Original
        <span aria-hidden>✓</span>
      </span>
    );
  }
  return (
    <span className="absolute top-2 left-2 z-10 inline-flex items-center rounded bg-[#1e3a5f] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
      Mall
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
  const countdown = useCountdown(product.dealEndsAt);
  const freeDelivery =
    product.freeDeliveryHint === true ||
    product.deliveryFeePaise === 0 ||
    product.minPricePaise >= 99_900;
  const hasRating =
    product.ratingAverage != null && (product.reviewCount ?? 0) > 0;
  const extraVariants = Math.max((product.variantCount ?? 1) - 1, 0);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden bg-accent-soft/40">
          {product.badge ? <BadgePill badge={product.badge} /> : null}
          <WishlistButton productId={product.id} />
          {showImage ? (
            <Image
              src={product.primaryImageUrl as string}
              alt={product.primaryImageAlt ?? product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U4ZjRmNCIvPjwvc3ZnPg=="
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-semibold text-accent/30" aria-hidden>
                {initials}
              </span>
              <span className="sr-only">No product image available</span>
            </div>
          )}
          {extraVariants > 0 ? (
            <span className="absolute right-2 bottom-2 z-10 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-semibold text-background backdrop-blur-sm">
              +{extraVariants} More
            </span>
          ) : null}
          {countdown ? (
            <div className="animate-deal-pulse absolute bottom-2 left-2 z-10 rounded-md bg-danger px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-white shadow-[0_0_0_2px_rgba(211,47,47,0.35)]">
              {countdown}
            </div>
          ) : null}
          {!inStock ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-foreground/70 px-2 py-1 text-center text-xs text-background">
              Out of stock
            </div>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <h3 className="line-clamp-2 text-sm leading-5 font-medium text-foreground">
            {product.title}
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-bold text-foreground">
              {formatPaise(product.minPricePaise)}
            </span>
            {product.minMrpPaise && product.minMrpPaise > product.minPricePaise ? (
              <span className="text-[13px] text-muted line-through">
                {formatPaise(product.minMrpPaise)}
              </span>
            ) : null}
            {discount ? (
              <span className="text-xs font-semibold text-success">
                {discount}% off
              </span>
            ) : null}
          </p>
          {hasRating ? (
            <p className="flex items-center gap-1.5 text-xs">
              <span className="inline-flex items-center gap-0.5 rounded bg-success px-1.5 py-0.5 font-semibold text-white">
                ★ {product.ratingAverage!.toFixed(1)}
              </span>
              <span className="text-muted">
                {(product.reviewCount ?? 0) >= 1000
                  ? `${((product.reviewCount ?? 0) / 1000).toFixed(1)}K reviews`
                  : `${product.reviewCount} reviews`}
              </span>
            </p>
          ) : null}
          {freeDelivery ? (
            <span className="inline-flex w-fit items-center rounded border border-success/25 bg-success-soft px-1.5 py-0.5 text-[11px] font-semibold text-success">
              Free Delivery
            </span>
          ) : (
            <p className="text-xs text-muted">
              {product.deliveryFeePaise != null
                ? `Delivery ${formatPaise(product.deliveryFeePaise)}`
                : "Delivery ₹60"}
            </p>
          )}
          {product.sellerVerified ? (
            <p className="mt-auto pt-0.5 text-[11px] font-medium text-accent">
              Verified ✓
            </p>
          ) : (
            <span className="mt-auto" />
          )}
        </div>
      </Link>
    </article>
  );
}
