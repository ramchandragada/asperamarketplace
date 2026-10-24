"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

async function toast(message: string) {
  const { showToast } = await import("@/components/toast-host");
  showToast(message);
}

/**
 * Compact "Add" control for product grid cards. Resolves the product's active
 * variants via the public product API: a single-variant product is added
 * straight to the cart; a multi-variant product sends the shopper to the PDP to
 * choose. Rendered outside the card's <Link> so it never nests interactives.
 */
export function GridAddButton({
  slug,
  productId,
  className = "",
}: {
  slug: string;
  productId?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function add(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/catalogue/products/${encodeURIComponent(slug)}`,
      );
      const body = (await res.json().catch(() => null)) as {
        data?: { product?: { variants?: Array<{ id: string }> } };
      } | null;
      const variants = body?.data?.product?.variants ?? [];
      // Multiple options (or none resolvable) → let the shopper choose on the PDP.
      if (variants.length !== 1) {
        router.push(`/products/${slug}`);
        return;
      }
      const variantId = variants[0]!.id;
      const addRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, quantity: 1 }),
      });
      if (addRes.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/cart")}`);
        return;
      }
      if (!addRes.ok) {
        const b = (await addRes.json().catch(() => null)) as {
          message?: string;
        } | null;
        await toast(b?.message ?? "Could not add to cart");
        return;
      }
      if (productId) {
        void import("@/components/analytics-beacon").then(
          ({ trackAddToCart }) => trackAddToCart(productId),
        );
      }
      await toast("Added to cart");
      // Re-run server components so the header cart count updates.
      router.refresh();
    } catch {
      await toast("Could not reach the cart. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={pending}
      aria-label="Add to cart"
      className={`inline-flex items-center justify-center rounded-full bg-accent px-3.5 py-1.5 text-[12px] font-semibold text-accent-foreground shadow-[var(--shadow-card)] transition hover:brightness-110 disabled:opacity-60 ${className}`}
    >
      {pending ? "Adding…" : "Add"}
    </button>
  );
}
