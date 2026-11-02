"use client";

import {
  extractProductFacets,
  getCategoryFacetConfig,
} from "@/modules/catalogue/category-facets";

type CategoryOption = { id: string; name: string; slug: string };

/** Suggest facets from title for the selected category (pure helper for parents). */
export function suggestFacetsFromTitle(input: {
  categories: CategoryOption[];
  categoryId: string;
  title: string;
  slugHint?: string;
}): Record<string, string> {
  const categorySlug =
    input.categories.find((entry) => entry.id === input.categoryId)?.slug ?? "";
  if (!categorySlug || !input.title.trim()) return {};
  return extractProductFacets({
    slug: input.slugHint ?? "admin-draft",
    title: input.title.trim(),
    categorySlug,
  });
}

/**
 * Category-specific facet editors for admin catalogue create/edit.
 * Fully controlled — parent owns values and title autofill.
 */
export function AdminFacetFields({
  categories,
  categoryId,
  title,
  slugHint = "admin-draft",
  values,
  onChange,
}: {
  categories: CategoryOption[];
  categoryId: string;
  title: string;
  slugHint?: string;
  values: Record<string, string>;
  onChange: (
    facets: Record<string, string>,
    meta?: { refill?: boolean },
  ) => void;
}) {
  const categorySlug =
    categories.find((entry) => entry.id === categoryId)?.slug ?? "";
  const config = getCategoryFacetConfig(categorySlug);
  const suggested = suggestFacetsFromTitle({
    categories,
    categoryId,
    title,
    slugHint,
  });

  if (!config || config.facets.length === 0) {
    return (
      <p className="sm:col-span-2 text-xs text-muted">
        Pick a PC category to set browse filters (socket, VRAM, wattage, …).
        Values autofill from the title; edit any field before saving.
      </p>
    );
  }

  function setFacet(key: string, value: string) {
    const next = { ...values };
    if (!value.trim()) delete next[key];
    else next[key] = value.trim();
    onChange(next);
  }

  return (
    <div className="sm:col-span-2 rounded-lg border border-border bg-background/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Browse filters</h3>
          <p className="mt-0.5 text-xs text-muted">
            Stored on the SKU for PLP filters. Autofill from title — override
            when the title is ambiguous.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:border-accent"
          onClick={() => onChange({ ...suggested }, { refill: true })}
        >
          Refill from title
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {config.facets.map((facet) => (
          <label key={facet.key} className="text-sm">
            {facet.label}
            <input
              value={values[facet.key] ?? ""}
              onChange={(event) => setFacet(facet.key, event.target.value)}
              placeholder={suggested[facet.key] ?? "—"}
              list={`facet-suggest-${facet.key}`}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
            {suggested[facet.key] ? (
              <datalist id={`facet-suggest-${facet.key}`}>
                <option value={suggested[facet.key]} />
              </datalist>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  );
}
