"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";

type CartView = {
  id: string;
  version: number;
  merchandisePaise: number;
  items: Array<{
    variantId: string;
    quantity: number;
    productTitle: string;
    productSlug: string;
    variantTitle: string;
    unitPricePaise: number;
    lineTotalPaise: number;
    availableQty: number;
    sellerName: string;
    inStock: boolean;
  }>;
};

export function CartPanel({ initialCart }: { initialCart: CartView }) {
  const [cart, setCart] = useState(initialCart);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {cart.items.length === 0 ? (
        <p className="text-muted">
          Your cart is empty.{" "}
          <Link href="/browse" className="underline">
            Browse listings
          </Link>
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {cart.items.map((item) => (
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
                  <p className="text-sm text-muted">
                    {item.variantTitle} · {item.sellerName}
                  </p>
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
                    <label className="text-sm">
                      Qty
                      <input
                        key={`${item.variantId}-${item.quantity}`}
                        type="number"
                        min={0}
                        max={Math.min(99, item.availableQty)}
                        defaultValue={item.quantity}
                        disabled={pending}
                        className="ml-2 h-11 w-20 rounded-full border border-border bg-background px-3 text-base md:h-auto md:py-1 md:text-sm"
                        onBlur={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next !== item.quantity) {
                            void setQuantity(item.variantId, next);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center text-sm font-medium text-danger underline md:min-h-0"
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
          <div className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <p className="text-lg font-semibold">
              Merchandise {formatPaise(cart.merchandisePaise)}
            </p>
            <p className="mt-1 text-sm text-muted">
              Delivery and taxes are confirmed at checkout.
            </p>
            <Link
              href="/checkout"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-accent px-4 py-2.5 font-semibold text-white sm:w-fit"
            >
              Continue to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
