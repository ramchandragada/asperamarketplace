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
    const title = String(form.get("title") ?? "");
    const summary = String(form.get("summary") ?? "");
    const description = String(form.get("description") ?? "");
    const imageUrl = String(form.get("imageUrl") ?? "").trim();
    const contentChanged =
      product.status === "approved" &&
      (title !== product.title ||
        summary !== product.summary ||
        description !== product.description ||
        (imageUrl !== "" && imageUrl !== (product.images[0]?.url ?? "")));
    if (contentChanged) {
      const confirmed = window.confirm(
        "This will unpublish the listing until it's re-approved. Continue?",
      );
      if (!confirmed) return;
    }
    const payload = {
      sellerId,
      title,
      summary,
      description,
      imageUrl: imageUrl || undefined,
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

  async function submit() {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/seller/products/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    const body = (await response.json()) as {
      message?: string;
      fieldErrors?: Record<string, string[]> | null;
    };
    if (!response.ok) {
      setError(apiErrorMessage(body, "Submit failed"));
      return;
    }
    setMessage(body.message ?? "Submitted for review");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Status: {product.status}</p>
          {product.statusReason ? (
            <p
              className={`text-sm ${
                product.status === "rejected"
                  ? "text-red-700"
                  : "text-muted"
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
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {product.status === "approved" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Changing title, summary, description, or image will unpublish this
          listing until an admin re-approves it. Price and stock-only edits keep
          it live.
        </p>
      ) : null}

      {product.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.images[0].url}
          alt={product.title}
          className="h-40 w-40 rounded-xl object-cover"
        />
      ) : null}

      <form
        onSubmit={save}
        className="grid max-w-2xl gap-3 rounded-card border border-border bg-surface p-4"
      >
        <label className="text-sm">
          Title
          <input
            name="title"
            required
            defaultValue={product.title}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Summary
          <input
            name="summary"
            required
            defaultValue={product.summary}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Description
          <textarea
            name="description"
            required
            rows={5}
            defaultValue={product.description}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Primary image URL (Unsplash https)
          <input
            name="imageUrl"
            type="url"
            defaultValue={product.images[0]?.url ?? ""}
            placeholder="https://images.unsplash.com/photo-..."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        {variant ? (
          <>
            <p className="text-sm text-muted">
              SKU {variant.sku} · reserved{" "}
              {variant.inventory?.reserved ?? 0} · current{" "}
              {formatPaise(variant.sellingPricePaise)}
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
          Save changes
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {product.status === "draft" || product.status === "rejected" ? (
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={() => void submit()}
          >
            Submit for review
          </button>
        ) : null}
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
