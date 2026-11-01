"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  formatPaise,
  paiseFromRupees,
  rupeesFromPaise,
} from "@/modules/catalogue/helpers";
import { apiErrorMessage } from "@/platform/http/api-error-message";

type Product = {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: string;
  statusReason: string | null;
  images: Array<{ id: string; url: string; isPrimary: boolean }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    mrpPaise: number;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

export function SellerProductEditPanel({
  sellerId,
  product,
}: {
  sellerId: string;
  product: Product;
}) {
  const variant = product.variants[0];
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!variant) {
      setError("Product has no variant to update");
      return;
    }
    const form = new FormData(event.currentTarget);
    const mrpRupees = Number(form.get("mrpRupees"));
    const sellingRupees = Number(form.get("sellingRupees"));
    if (!(mrpRupees > 0) || !(sellingRupees > 0)) {
      setError("Enter MRP and selling price in rupees");
      return;
    }
    if (sellingRupees > mrpRupees) {
      setError("Selling price cannot be greater than MRP");
      return;
    }
    const payload = {
      sellerId,
      variant: {
        id: variant.id,
        mrpPaise: paiseFromRupees(mrpRupees),
        sellingPricePaise: paiseFromRupees(sellingRupees),
        onHand: Number(form.get("onHand")),
      },
    };
    const response = await fetch(`/api/seller/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      message?: string;
      fieldErrors?: Record<string, string[]> | null;
    };
    if (!response.ok) {
      setError(apiErrorMessage(body, "Update failed"));
      return;
    }
    setMessage(body.message ?? "Saved");
  }

  async function setStatus(status: "draft" | "archived") {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/seller/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sellerId, status }),
    });
    const body = (await response.json()) as {
      message?: string;
      fieldErrors?: Record<string, string[]> | null;
    };
    if (!response.ok) {
      setError(apiErrorMessage(body, "Status change failed"));
      return;
    }
    setMessage(status === "archived" ? "Listing paused" : "Moved to draft");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Status: {product.status}</p>
          {product.statusReason ? (
            <p
              className={`text-sm ${
                product.status === "rejected" ? "text-danger" : "text-muted"
              }`}
            >
              {product.statusReason}
            </p>
          ) : null}
        </div>
        <Link href="/seller/catalogue" className="text-sm text-accent underline">
          Back to catalogue
        </Link>
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
        Product title, specs, and images are controlled by Aspera. You can only
        change price and stock on this listing.
      </p>

      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0].url}
          alt={product.title}
          className="h-40 w-40 rounded-xl object-cover"
        />
      ) : null}

      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <p className="mt-2 text-sm text-muted">{product.summary}</p>
      </div>

      <form
        onSubmit={save}
        className="grid max-w-2xl gap-3 rounded-card border border-border bg-surface p-4"
      >
        {variant ? (
          <>
            <p className="text-sm text-muted">
              SKU {variant.sku} · reserved {variant.inventory?.reserved ?? 0} ·
              current {formatPaise(variant.sellingPricePaise)}
            </p>
            <label className="text-sm">
              MRP (₹)
              <input
                name="mrpRupees"
                type="number"
                required
                min={1}
                step="0.01"
                defaultValue={rupeesFromPaise(variant.mrpPaise)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Selling price (₹)
              <input
                name="sellingRupees"
                type="number"
                required
                min={1}
                step="0.01"
                defaultValue={rupeesFromPaise(variant.sellingPricePaise)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              On-hand stock
              <input
                name="onHand"
                type="number"
                required
                min={0}
                defaultValue={variant.inventory?.onHand ?? 0}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </>
        ) : null}
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Save price &amp; stock
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {product.status === "approved" ? (
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={() => void setStatus("archived")}
          >
            Pause / unlist
          </button>
        ) : null}
        {product.status === "archived" ? (
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={() => void setStatus("draft")}
          >
            Move to draft
          </button>
        ) : null}
      </div>
    </div>
  );
}
