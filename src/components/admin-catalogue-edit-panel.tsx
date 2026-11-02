"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminFacetFields,
  suggestFacetsFromTitle,
} from "@/components/admin-facet-fields";
import { mergeFacetOverrides } from "@/modules/catalogue/category-facets";
import { apiErrorMessage } from "@/platform/http/api-error-message";

type Category = { id: string; name: string; slug: string };

type EditableProduct = {
  id: string;
  slug?: string;
  title: string;
  summary: string;
  description: string;
  status: string;
  hsnCode: string | null;
  category: { id: string; name: string; slug?: string };
  images: Array<{ url: string }>;
  attributes?: unknown;
};

function readExistingFacets(
  attributes: unknown,
): Record<string, string> | null {
  if (!attributes || typeof attributes !== "object") return null;
  const facets = (attributes as { facets?: unknown }).facets;
  if (!facets || typeof facets !== "object") return null;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(facets)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim();
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function AdminCatalogueEditPanel({
  product,
  categories,
  onDone,
}: {
  product: EditableProduct;
  categories: Category[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(product.category.id);
  const [title, setTitle] = useState(product.title);
  const existingFacets = readExistingFacets(product.attributes);
  const [facets, setFacets] = useState<Record<string, string>>(
    () => existingFacets ?? {},
  );
  const [facetsTouched, setFacetsTouched] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      summary: String(form.get("summary") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      categoryId: String(form.get("categoryId") ?? "").trim(),
      hsnCode: String(form.get("hsnCode") ?? "").trim() || null,
      imageUrl: String(form.get("imageUrl") ?? "").trim() || undefined,
      facets,
    };
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string[]> | null;
      };
      if (!response.ok) {
        setError(apiErrorMessage(body, "Could not update catalogue product"));
        return;
      }
      setMessage(body.message ?? "Catalogue product updated");
      onDone?.();
      router.refresh();
    } catch {
      setError("Update request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2"
    >
      <h3 className="sm:col-span-2 text-sm font-semibold">Edit catalogue SKU</h3>
      {message ? (
        <p className="sm:col-span-2 text-sm text-success">{message}</p>
      ) : null}
      {error ? (
        <p role="alert" className="sm:col-span-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <label className="sm:col-span-2 text-sm">
        Title
        <input
          name="title"
          required
          minLength={3}
          value={title}
          onChange={(event) => {
            const nextTitle = event.target.value;
            setTitle(nextTitle);
            if (!facetsTouched) {
              const slug =
                categories.find((entry) => entry.id === categoryId)?.slug ?? "";
              setFacets(
                mergeFacetOverrides(
                  suggestFacetsFromTitle({
                    categories,
                    categoryId,
                    title: nextTitle,
                    slugHint: product.slug ?? "admin-edit",
                  }),
                  existingFacets,
                  slug,
                ),
              );
            }
          }}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="text-sm">
        Category
        <select
          name="categoryId"
          required
          value={categoryId}
          onChange={(event) => {
            const nextCategoryId = event.target.value;
            setCategoryId(nextCategoryId);
            // Category change always rebuilds facets for the new schema only
            // (never carry processor keys onto a monitor, etc.).
            setFacetsTouched(false);
            setFacets(
              suggestFacetsFromTitle({
                categories,
                categoryId: nextCategoryId,
                title,
                slugHint: product.slug ?? "admin-edit",
              }),
            );
          }}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        HSN
        <input
          name="hsnCode"
          defaultValue={product.hsnCode ?? ""}
          pattern="\d{4,8}"
          placeholder="4–8 digits"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono"
        />
      </label>
      <AdminFacetFields
        categories={categories}
        categoryId={categoryId}
        title={title}
        slugHint={product.slug ?? "admin-edit"}
        values={facets}
        onChange={(next, meta) => {
          setFacetsTouched(!meta?.refill);
          setFacets(next);
        }}
      />
      <label className="sm:col-span-2 text-sm">
        Summary
        <textarea
          name="summary"
          required
          minLength={10}
          rows={2}
          defaultValue={product.summary}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="sm:col-span-2 text-sm">
        Description
        <textarea
          name="description"
          required
          minLength={20}
          rows={4}
          defaultValue={product.description}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="sm:col-span-2 text-sm">
        Image URL
        <input
          name="imageUrl"
          type="url"
          defaultValue={product.images[0]?.url ?? ""}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
        <span className="mt-1 block text-xs text-muted">
          Leave blank to keep the current image.
        </span>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
