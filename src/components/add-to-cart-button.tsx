"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  variantId,
  availableQty,
  productTitle,
  selectionRequired = false,
  selectionHint = "Please select a size",
}: {
  variantId: string;
  availableQty: number;
  productTitle?: string;
  /** When true, block add-to-cart until the shopper chooses a required option. */
  selectionRequired?: boolean;
  selectionHint?: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add() {
    if (selectionRequired) {
      setError(selectionHint);
      setMessage(null);
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
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
      setMessage(body.message ?? "Added");
      void import("@/components/toast-host").then(({ showToast }) => {
        showToast(
          productTitle
            ? `✓ Added to cart — ${productTitle}`
            : "✓ Added to cart",
        );
      });
      router.refresh();
    } catch {
      setError("Could not reach the cart service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (availableQty < 1) {
    return <p className="text-sm text-muted">Out of stock</p>;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Qty
          <input
            type="number"
            min={1}
            max={Math.min(99, availableQty)}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value) || 1)}
            className="ml-2 w-20 rounded-lg border border-border bg-background px-2 py-1"
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => void add()}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add to cart"}
        </button>
        <a href="/cart" className="text-sm underline">
          View cart
        </a>
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <div className="flex flex-wrap items-center gap-2">
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
