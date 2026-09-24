"use client";

import { useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type AdminProduct = {
  id: string;
  title: string;
  status: string;
  version: number;
  statusReason: string | null;
  seller: { id: string; legalName: string; tradeName: string | null };
  category: { name: string };
  variants: Array<{
    sku: string;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

export function AdminProductQueue({
  initialProducts,
}: {
  initialProducts: AdminProduct[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/products");
    const body = (await response.json()) as {
      data?: { products: AdminProduct[] };
      message?: string;
    };
    if (!response.ok) {
      setError(body.message ?? "Unable to load queue");
      return;
    }
    setProducts(body.data?.products ?? []);
  }

  async function review(
    product: AdminProduct,
    decision: "approve" | "reject",
  ) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/products/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        decision,
        reason:
          decision === "approve"
            ? "Catalogue attributes accepted in development review"
            : "Listing incomplete or inconsistent with category rules",
        expectedVersion: product.version,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Review failed");
      return;
    }
    setMessage(body.message ?? "Updated");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {products.map((product) => {
        const variant = product.variants[0];
        return (
          <article
            key={product.id}
            className="rounded-card border border-border bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">{product.title}</h2>
            <p className="text-sm text-muted">
              {product.seller.tradeName ?? product.seller.legalName} ·{" "}
              {product.category.name}
            </p>
            <p className="text-sm">Status: {product.status}</p>
            {product.statusReason ? (
              <p className="text-sm text-muted">Reason: {product.statusReason}</p>
            ) : null}
            {variant ? (
              <p className="mt-1 text-sm">
                {variant.sku} · {formatPaise(variant.sellingPricePaise)} · on hand{" "}
                {variant.inventory?.onHand ?? 0}
              </p>
            ) : null}
            {product.status === "submitted" ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                  onClick={() => void review(product, "approve")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                  onClick={() => void review(product, "reject")}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
      {products.length === 0 ? (
        <p className="text-sm text-muted">No products in the moderation queue.</p>
      ) : null}
    </div>
  );
}
