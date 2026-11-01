"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { paiseFromRupees } from "@/modules/catalogue/helpers";
import { apiErrorMessage } from "@/platform/http/api-error-message";

type Category = { id: string; name: string };

export function AdminCatalogueCreatePanel({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const mrpRupees = Number(form.get("mrpRupees"));
    const sellingRupees = Number(form.get("sellingRupees"));
    if (!(mrpRupees > 0) || !(sellingRupees > 0)) {
      setError("Enter MRP and reference selling price in rupees");
      return;
    }
    if (sellingRupees > mrpRupees) {
      setError("Selling price cannot be greater than MRP");
      return;
    }
    const payload = {
      categoryId: String(form.get("categoryId") ?? ""),
      brandName: String(form.get("brandName") ?? "") || undefined,
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      description: String(form.get("description") ?? ""),
      countryOfOrigin: String(form.get("countryOfOrigin") ?? "") || undefined,
      hsnCode: String(form.get("hsnCode") ?? "") || undefined,
      imageUrl: String(form.get("imageUrl") ?? "").trim(),
      variant: {
        sku: String(form.get("sku") ?? "").toUpperCase(),
        title: String(form.get("variantTitle") ?? ""),
        mrpPaise: paiseFromRupees(mrpRupees),
        sellingPricePaise: paiseFromRupees(sellingRupees),
        weightGrams: form.get("weightGrams")
          ? Number(form.get("weightGrams"))
          : undefined,
      },
    };
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string[]> | null;
      };
      if (!response.ok) {
        setError(apiErrorMessage(body, "Could not create catalogue product"));
        return;
      }
      setMessage(body.message ?? "Catalogue product published");
      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Create request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Add catalogue product</h2>
          <p className="mt-1 text-sm text-muted">
            Only admins author SKUs. Sellers pick from this catalogue and set
            price and stock.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-border px-3 py-2 text-sm"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide form" : "New SKU"}
        </button>
      </div>

      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      {open ? (
        <form
          onSubmit={onSubmit}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
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
            Catalogue SKU
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
              min={0.01}
              step="0.01"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Reference price (₹)
            <input
              name="sellingRupees"
              type="number"
              required
              min={0.01}
              step="0.01"
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
            disabled={busy}
            className="sm:col-span-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50"
          >
            {busy ? "Publishing…" : "Publish catalogue SKU"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
