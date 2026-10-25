"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";
import { EmptyState } from "@/components/ui/empty-state";

type CartItem = {
  variantId: string;
  quantity: number;
  productTitle: string;
  productSlug: string;
  variantTitle: string;
  unitPricePaise: number;
  mrpPaise?: number;
  lineTotalPaise: number;
  availableQty: number;
  sellerId: string;
  sellerName: string;
  inStock: boolean;
};

type CartView = {
  id: string;
  version: number;
  merchandisePaise: number;
  items: CartItem[];
};

type EstimateSnapshot = {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  groups: Array<{
    sellerId: string;
    sellerName: string;
    lineTotalPaise: number;
  }>;
  coupon: {
    code: string | null;
    accepted: boolean;
    reason: string;
    discountPaise: number;
  };
};

export function CartPanel({
  initialCart,
  initialSnapshot = null,
  initialSavingsPaise = 0,
}: {
  initialCart: CartView;
  initialSnapshot?: EstimateSnapshot | null;
  initialSavingsPaise?: number;
}) {
  const [cart, setCart] = useState(initialCart);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [snapshot, setSnapshot] = useState<EstimateSnapshot | null>(
    initialSnapshot,
  );
  const [savingsPaise, setSavingsPaise] = useState(initialSavingsPaise);

  const sellerGroups = useMemo(() => {
    const map = new Map<
      string,
      { sellerId: string; sellerName: string; items: CartItem[]; subtotal: number }
    >();
    for (const item of cart.items) {
      const existing = map.get(item.sellerId);
      if (existing) {
        existing.items.push(item);
        existing.subtotal += item.lineTotalPaise;
      } else {
        map.set(item.sellerId, {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          items: [item],
          subtotal: item.lineTotalPaise,
        });
      }
    }
    return [...map.values()];
  }, [cart.items]);

  async function refreshEstimate(coupon?: string) {
    if (cart.items.length === 0) {
      setSnapshot(null);
      setSavingsPaise(0);
      return;
    }
    const response = await fetch("/api/cart/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        couponCode: coupon || undefined,
      }),
    });
    const body = (await response.json()) as {
      data?: {
        cart: CartView;
        snapshot: EstimateSnapshot | null;
        savingsPaise: number;
      };
      message?: string;
    };
    if (!response.ok) {
      setError(body.message ?? "Could not estimate totals");
      return;
    }
    if (body.data?.cart) setCart(body.data.cart);
    setSnapshot(body.data?.snapshot ?? null);
    setSavingsPaise(body.data?.savingsPaise ?? 0);
    setError(null);
  }

  async function setQuantity(variantId: string, quantity: number) {
    setPending(true);
    setError(null);
    const response = await fetch("/api/cart/items", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    const body = (await response.json()) as {
      data?: { cart: CartView };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not update cart");
      return;
    }
    if (body.data?.cart) {
      setCart(body.data.cart);
      void refreshEstimate(appliedCoupon);
    }
  }

  async function applyCoupon() {
    setPending(true);
    setError(null);
    const code = couponCode.trim().toUpperCase();
    const response = await fetch("/api/cart/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ couponCode: code || undefined }),
    });
    const body = (await response.json()) as {
      data?: {
        cart: CartView;
        snapshot: EstimateSnapshot | null;
        savingsPaise: number;
      };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Coupon could not be applied");
      return;
    }
    if (body.data?.cart) setCart(body.data.cart);
    setSnapshot(body.data?.snapshot ?? null);
    setSavingsPaise(body.data?.savingsPaise ?? 0);
    setAppliedCoupon(code || undefined);
    if (code && body.data?.snapshot && !body.data.snapshot.coupon.accepted) {
      setError(body.data.snapshot.coupon.reason);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {cart.items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse thousands of products from verified Indian sellers and add your favourites here."
          action={
            <Link href="/browse" className="btn-cta btn-cta-primary px-6">
              Start shopping
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-6">
            {sellerGroups.map((group) => (
              <section key={group.sellerId} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">
                    Sold by {group.sellerName}
                  </h2>
                  <p className="text-sm text-muted">
                    Subtotal {formatPaise(group.subtotal)}
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <li
                      key={item.variantId}
                      className="flex gap-3 rounded-2xl bg-surface p-3 shadow-[var(--shadow-card)]"
                    >
                      <span
                        className="photo-well flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-accent/50"
                        aria-hidden
                      >
                        {item.productTitle.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-medium hover:underline"
                        >
                          {item.productTitle}
                        </Link>
                        <p className="text-sm text-muted">{item.variantTitle}</p>
                        <p className="mt-1 text-sm">
                          <span className="font-semibold">
                            {formatPaise(item.lineTotalPaise)}
                          </span>
                          <span className="text-muted">
                            {" "}
                            · {formatPaise(item.unitPricePaise)} each
                          </span>
                          {!item.inStock ? " · stock issue" : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-sm text-muted">
                            Qty
                            <input
                              key={`${item.variantId}-${item.quantity}`}
                              type="number"
                              min={0}
                              max={Math.min(99, item.availableQty)}
                              defaultValue={item.quantity}
                              disabled={pending}
                              className="h-11 w-16 rounded-[var(--radius-sm)] border border-border bg-background px-2 text-center text-sm font-semibold text-foreground md:h-9"
                              onBlur={(event) => {
                                const next = Number(event.target.value);
                                if (
                                  Number.isFinite(next) &&
                                  next !== item.quantity
                                ) {
                                  void setQuantity(item.variantId, next);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="btn-cta btn-cta-ghost h-11 px-3 text-danger md:h-9"
                            disabled={pending}
                            onClick={() => void setQuantity(item.variantId, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {sellerGroups.length > 1 ? (
                  <p className="text-xs text-muted">
                    Ships separately from this seller.
                  </p>
                ) : null}
              </section>
            ))}
          </div>

          <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">Price details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Items total</dt>
                <dd>
                  {formatPaise(snapshot?.subtotalPaise ?? cart.merchandisePaise)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Delivery</dt>
                <dd>
                  {snapshot
                    ? snapshot.shippingPaise === 0
                      ? "FREE"
                      : formatPaise(snapshot.shippingPaise)
                    : "At checkout"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Discount</dt>
                <dd>
                  {snapshot && snapshot.discountPaise > 0
                    ? `−${formatPaise(snapshot.discountPaise)}`
                    : formatPaise(0)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Estimated GST</dt>
                <dd>{formatPaise(snapshot?.taxPaise ?? 0)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
                <dt>Total payable</dt>
                <dd>
                  {formatPaise(
                    snapshot?.totalPaise ?? cart.merchandisePaise,
                  )}
                </dd>
              </div>
            </dl>
            {savingsPaise > 0 ? (
              <p className="mt-2 text-sm font-medium text-success">
                You save {formatPaise(savingsPaise)}
              </p>
            ) : null}
            {snapshot?.coupon.accepted ? (
              <p className="mt-1 text-xs text-muted">
                Coupon {snapshot.coupon.code} applied
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="Coupon code (e.g. ASPERA10)"
                className="h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
                disabled={pending}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => void applyCoupon()}
                className="btn-cta btn-cta-ghost"
              >
                Apply
              </button>
            </div>

            <p className="mt-3 text-xs text-muted">
              Aspera Express ETA and tax confirmed at checkout
              {sellerGroups.length > 1
                ? ` · ${sellerGroups.length} hub shipments`
                : ""}
              .
            </p>
            <Link
              href="/checkout"
              className="btn-cta btn-cta-primary mt-4 w-full sm:w-auto"
            >
              Continue to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
