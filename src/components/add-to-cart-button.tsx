"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  variantId,
  productId,
  availableQty,
  productTitle,
  selectionRequired = false,
  selectionHint = "Please select a size",
  /** Compact PDP sticky bar: no inline View cart / success text (toast handles it). */
  compact = false,
}: {
  variantId: string;
  productId?: string;
  availableQty: number;
  productTitle?: string;
  /** When true, block add-to-cart until the shopper chooses a required option. */
  selectionRequired?: boolean;
  selectionHint?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clampQty(value: number) {
    const max = Math.min(99, availableQty);
    return Math.max(1, Math.min(max, value));
  }

  async function add() {
    if (selectionRequired) {
      setError(selectionHint);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      });
      const body = (await response.json()) as {
        message?: string;
        code?: string;
      };
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/cart")}`);
        return;
      }
      if (!response.ok) {
        setError(body.message ?? "Could not add to cart");
        return;
      }
      if (productId) {
        void import("@/components/analytics-beacon").then(({ trackAddToCart }) => {
          trackAddToCart(productId);
        });
      }
      void import("@/components/toast-host").then(({ showToast }) => {
        showToast(
          productTitle
            ? `Added to cart — ${productTitle}`
            : "Added to cart",
        );
      });
      router.refresh();
    } catch {
      setError(
        "Could not reach the cart service. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (availableQty < 1) {
    return <p className="text-sm text-muted">Out of stock</p>;
  }

  return (
    <div className={compact ? "contents" : "flex w-full flex-col gap-2"}>
      <div
        className={
          compact
            ? "contents"
            : "flex w-full flex-wrap items-center gap-2"
        }
      >
        <div className="qty-stepper" aria-label="Quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || pending}
            onClick={() => setQuantity((q) => clampQty(q - 1))}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={Math.min(99, availableQty)}
            value={quantity}
            aria-label="Quantity"
            onChange={(event) =>
              setQuantity(clampQty(Number(event.target.value) || 1))
            }
          />
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= Math.min(99, availableQty) || pending}
            onClick={() => setQuantity((q) => clampQty(q + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void add()}
          className={`btn-cta btn-cta-secondary ${compact ? "min-w-0 flex-1" : "min-w-[9.5rem]"}`}
        >
          {pending ? "Adding…" : "Add to cart"}
        </button>
        {!compact ? (
          <a
            href="/cart"
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            View cart
          </a>
        ) : null}
      </div>
      {error ? (
        <div
          className={
            compact
              ? "basis-full text-sm text-red-700"
              : "flex flex-wrap items-center gap-2"
          }
        >
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
          {!selectionRequired ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void add()}
              className="text-sm font-semibold text-accent underline disabled:opacity-60"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
