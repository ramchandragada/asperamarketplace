"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  discountPercent,
  formatPaise,
  paiseFromRupees,
} from "@/modules/catalogue/helpers";

type Category = { id: string; slug: string; name: string };

type SellerProduct = {
  id: string;
  title: string;
  status: string;
  version: number;
  slug: string;
  statusReason?: string | null;
  category: { name: string };
  images?: Array<{ url: string }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    mrpPaise: number;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

export function SellerCataloguePanel({
  sellerId,
  categories,
  initialProducts,
  initialTotal,
  initialPage,
  initialPageSize,
  initialQuery,
  initialStatus,
}: {
  sellerId: string;
  categories: Category[];
  initialProducts: SellerProduct[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialQuery: string;
  initialStatus: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = initialPageSize;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const statusOptions = useMemo(
    () => ["", "draft", "submitted", "approved", "rejected", "archived"],
    [],
  );

  async function refresh(next?: {
    page?: number;
    q?: string;
    status?: string;
  }) {
    const nextPage = next?.page ?? page;
    const nextQ = next?.q ?? query;
    const nextStatus = next?.status ?? status;
    const params = new URLSearchParams({
      sellerId,
      page: String(nextPage),
      pageSize: String(pageSize),
    });
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    const response = await fetch(`/api/seller/products?${params}`);
    const body = (await response.json()) as {
      data?: {
        products?: SellerProduct[];
        items?: SellerProduct[];
        total?: number;
        page?: number;
      };
      message?: string;
    };
    if (!response.ok) {
      setError(body.message ?? "Could not load products");
      return;
    }
    setProducts(body.data?.products ?? body.data?.items ?? []);
    setTotal(body.data?.total ?? 0);
    setPage(body.data?.page ?? nextPage);
    setQuery(nextQ);
    setStatus(nextStatus);
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
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
    const imageUrl = String(form.get("imageUrl") ?? "").trim();
    if (!imageUrl) {
      setError("Add at least one product image URL (Unsplash https link)");
      return;
    }
    const payload = {
      sellerId,
      categoryId: String(form.get("categoryId") ?? ""),
      brandName: String(form.get("brandName") ?? "") || undefined,
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      description: String(form.get("description") ?? ""),
      countryOfOrigin: String(form.get("countryOfOrigin") ?? "") || undefined,
      hsnCode: String(form.get("hsnCode") ?? "") || undefined,
      imageUrl,
      variant: {
        sku: String(form.get("sku") ?? "").toUpperCase(),
        title: String(form.get("variantTitle") ?? ""),
        mrpPaise: paiseFromRupees(mrpRupees),
        sellingPricePaise: paiseFromRupees(sellingRupees),
        initialStock: Number(form.get("initialStock")),
        weightGrams: form.get("weightGrams")
          ? Number(form.get("weightGrams"))
          : undefined,
      },
    };
    const response = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not create draft");
      return;
    }
    setMessage("Product draft created");
    event.currentTarget.reset();
    await refresh({ page: 1 });
  }

  async function createOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const mrpRupees = Number(form.get("offerMrpRupees"));
    const sellingRupees = Number(form.get("offerSellingRupees"));
    if (sellingRupees > mrpRupees) {
      setError("Selling price cannot be greater than MRP");
      return;
    }
    const payload = {
      sellerId,
      sourceProductId: String(form.get("sourceProductId") ?? "").trim(),
      variant: {
        sku: String(form.get("offerSku") ?? "").toUpperCase(),
        title: String(form.get("offerVariantTitle") ?? "") || undefined,
        mrpPaise: paiseFromRupees(mrpRupees),
        sellingPricePaise: paiseFromRupees(sellingRupees),
        initialStock: Number(form.get("offerInitialStock")),
      },
    };
    const response = await fetch("/api/seller/products/offer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not create offer");
      return;
    }
    setMessage(
      body.message ??
        "Offer draft created — submit it for review to appear on the product page",
    );
    event.currentTarget.reset();
    await refresh({ page: 1 });
  }

  async function submitProduct(productId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/seller/products/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Submit failed");
      return;
    }
    setMessage(body.message ?? "Submitted");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <form
        onSubmit={createOffer}
        className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          Sell an existing product
        </h2>
        <p className="sm:col-span-2 text-sm text-muted">
          Paste the product id from an approved listing. You keep your own price,
          SKU, and stock.
        </p>
        <label className="text-sm sm:col-span-2">
          Source product id
          <input
            name="sourceProductId"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="text-sm">
          Your SKU
          <input
            name="offerSku"
            required
            pattern="[A-Z0-9-]+"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 uppercase"
          />
        </label>
        <label className="text-sm">
          Variant title
          <input
            name="offerVariantTitle"
            defaultValue="Standard"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          MRP (₹)
          <input
            name="offerMrpRupees"
            type="number"
            required
            min={1}
            step="0.01"
            defaultValue={499}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Selling price (₹)
          <input
            name="offerSellingRupees"
            type="number"
            required
            min={1}
            step="0.01"
            defaultValue={399}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Initial stock
          <input
            name="offerInitialStock"
            type="number"
            required
            min={0}
            defaultValue={20}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg border border-border bg-background px-4 py-2 font-medium"
        >
          Create offer draft
        </button>
      </form>

      <form
        onSubmit={createDraft}
        className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">New product draft</h2>
        <label className="text-sm sm:col-span-2">
          Category
          <select
            name="categoryId"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            defaultValue={categories[0]?.id}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Title
          <input
            name="title"
            required
            minLength={3}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Summary
          <input
            name="summary"
            required
            minLength={10}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Description
          <textarea
            name="description"
            required
            minLength={20}
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Primary image URL (Unsplash https)
          <input
            name="imageUrl"
            type="url"
            required
            placeholder="https://images.unsplash.com/photo-..."
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Brand (optional)
          <input
            name="brandName"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Country of origin
          <input
            name="countryOfOrigin"
            defaultValue="India"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          HSN (optional)
          <input
            name="hsnCode"
            pattern="\d{4,8}"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          SKU
          <input
            name="sku"
            required
            pattern="[A-Z0-9-]+"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 uppercase"
          />
        </label>
        <label className="text-sm">
          Variant title
          <input
            name="variantTitle"
            required
            defaultValue="Default"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          MRP (₹)
          <input
            name="mrpRupees"
            type="number"
            required
            min={1}
            step="0.01"
            defaultValue={499}
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
            defaultValue={399}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Initial stock
          <input
            name="initialStock"
            type="number"
            required
            min={0}
            defaultValue={25}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Weight grams (optional)
          <input
            name="weightGrams"
            type="number"
            min={1}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Create draft
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void refresh({
                page: 1,
                q: String(form.get("q") ?? ""),
                status: String(form.get("status") ?? ""),
              });
            }}
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="Search title or SKU"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {statusOptions.map((value) => (
                <option key={value || "all"} value={value}>
                  {value || "All statuses"}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Filter
            </button>
          </form>
        </div>
        <p className="text-sm text-muted">
          {total} listing{total === 1 ? "" : "s"} · page {page} of {pageCount}
        </p>
        {products.map((product) => {
          const variant = product.variants[0];
          const available = Math.max(
            (variant?.inventory?.onHand ?? 0) -
              (variant?.inventory?.reserved ?? 0),
            0,
          );
          const off =
            variant != null
              ? discountPercent(variant.mrpPaise, variant.sellingPricePaise)
              : null;
          return (
            <article
              key={product.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    <Link
                      href={`/seller/catalogue/${product.id}`}
                      className="text-accent hover:underline"
                    >
                      {product.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted">
                    {product.status} · {product.category.name} · {product.slug}
                  </p>
                  {product.status === "rejected" && product.statusReason ? (
                    <p className="mt-1 text-sm text-red-700">
                      Rejected: {product.statusReason}
                    </p>
                  ) : null}
                  {variant ? (
                    <p className="mt-1 text-sm">
                      {variant.sku} · {formatPaise(variant.sellingPricePaise)}
                      {variant.mrpPaise > variant.sellingPricePaise ? (
                        <span className="ml-2 text-muted line-through">
                          {formatPaise(variant.mrpPaise)}
                        </span>
                      ) : null}
                      {off ? (
                        <span className="ml-2 text-accent">{off}% off</span>
                      ) : null}
                      {" · "}
                      {available} available
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/seller/catalogue/${product.id}`}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    Edit
                  </Link>
                  {product.status === "draft" || product.status === "rejected" ? (
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                      onClick={() => void submitProduct(product.id)}
                    >
                      Submit for review
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        {products.length === 0 ? (
          <p className="text-sm text-muted">No products match this filter.</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void refresh({ page: page - 1 })}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pageCount}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void refresh({ page: page + 1 })}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
