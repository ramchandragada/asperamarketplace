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
          <ul className="flex flex-col gap-4">
            {cart.items.map((item) => (
              <li key={item.variantId} className="border-b border-border pb-4">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="font-medium hover:underline"
                >
                  {item.productTitle}
                </Link>
                <p className="text-sm text-muted">
                  {item.variantTitle} · {item.sellerName}
                </p>
                <p className="text-sm">
                  {formatPaise(item.unitPricePaise)} each · line{" "}
                  {formatPaise(item.lineTotalPaise)}
                  {!item.inStock ? " · stock issue" : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="text-sm">
                    Qty
                    <input
                      type="number"
                      min={0}
                      max={Math.min(99, item.availableQty)}
                      defaultValue={item.quantity}
                      disabled={pending}
                      className="ml-2 w-20 rounded-lg border border-border bg-background px-2 py-1"
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
                    className="text-sm underline"
                    disabled={pending}
                    onClick={() => void setQuantity(item.variantId, 0)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-lg font-semibold">
            Merchandise {formatPaise(cart.merchandisePaise)}
          </p>
          <p className="text-sm text-muted">
            Shipping, tax, and coupons are calculated on the checkout review
            page from server rules. Browser totals are not trusted.
          </p>
          <Link
            href="/checkout"
            className="inline-flex w-fit rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
          >
            Proceed to checkout
          </Link>
        </>
      )}
    </div>
  );
}
