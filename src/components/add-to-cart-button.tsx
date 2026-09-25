"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({
  variantId,
  availableQty,
}: {
  variantId: string;
  availableQty: number;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function add() {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
    });
    const body = (await response.json()) as { message?: string; code?: string };
    setPending(false);
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok) {
      setError(body.message ?? "Could not add to cart");
      return;
    }
    setMessage(body.message ?? "Added");
    void import("@/components/toast-host").then(({ showToast }) => {
      showToast("Added to cart");
    });
    router.refresh();
  }

  if (availableQty < 1) {
    return <p className="text-sm text-muted">Out of stock</p>;
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
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
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
