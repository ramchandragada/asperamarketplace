"use client";

import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type Category = { id: string; slug: string; name: string };

type SellerProduct = {
  id: string;
  title: string;
  status: string;
  version: number;
  slug: string;
  category: { name: string };
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

export function SellerCataloguePanel({
  sellerId,
  categories,
  initialProducts,
}: {
  sellerId: string;
  categories: Category[];
  initialProducts: SellerProduct[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch(
      `/api/seller/products?sellerId=${encodeURIComponent(sellerId)}`,
    );
    const body = (await response.json()) as {
      data?: { products: SellerProduct[] };
    };
    if (response.ok) {
      setProducts(body.data?.products ?? []);
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      sellerId,
      categoryId: String(form.get("categoryId") ?? ""),
      brandName: String(form.get("brandName") ?? "") || undefined,
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      description: String(form.get("description") ?? ""),
      countryOfOrigin: String(form.get("countryOfOrigin") ?? "") || undefined,
      hsnCode: String(form.get("hsnCode") ?? "") || undefined,
      variant: {
        sku: String(form.get("sku") ?? "").toUpperCase(),
        title: String(form.get("variantTitle") ?? ""),
        mrpPaise: Number(form.get("mrpPaise")),
        sellingPricePaise: Number(form.get("sellingPricePaise")),
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
    await refresh();
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
          MRP (paise)
          <input
            name="mrpPaise"
            type="number"
            required
            min={1}
            defaultValue={49900}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Selling price (paise)
          <input
            name="sellingPricePaise"
            type="number"
            required
            min={1}
            defaultValue={39900}
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
        <h2 className="text-lg font-semibold">Your listings</h2>
        {products.map((product) => {
          const variant = product.variants[0];
          const available = Math.max(
            (variant?.inventory?.onHand ?? 0) -
              (variant?.inventory?.reserved ?? 0),
            0,
          );
          return (
            <article
              key={product.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <h3 className="font-semibold">{product.title}</h3>
              <p className="text-sm text-muted">
                {product.status} · {product.category.name} · {product.slug}
              </p>
              {variant ? (
                <p className="mt-1 text-sm">
                  {variant.sku} · {formatPaise(variant.sellingPricePaise)} ·{" "}
                  {available} available
                </p>
              ) : null}
              {product.status === "draft" || product.status === "rejected" ? (
                <button
                  type="button"
                  className="mt-3 rounded-lg border border-border px-3 py-2 text-sm"
                  onClick={() => void submitProduct(product.id)}
                >
                  Submit for review
                </button>
              ) : null}
            </article>
          );
        })}
        {products.length === 0 ? (
          <p className="text-sm text-muted">No products yet.</p>
        ) : null}
      </section>
    </div>
  );
}
