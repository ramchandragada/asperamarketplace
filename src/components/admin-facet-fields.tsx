"use client";

import { useEffect, useMemo, useState } from "react";
import {
  extractProductFacets,
  getCategoryFacetConfig,
  mergeFacetOverrides,
} from "@/modules/catalogue/category-facets";

type CategoryOption = { id: string; name: string; slug: string };

/**
 * Category-specific facet editors for admin catalogue create/edit.
 * Title changes autofill suggestions; admins can override any value.
 */
export function AdminFacetFields({
  categories,
  categoryId,
  title,
  slugHint = "admin-draft",
  initialFacets,
  onChange,
}: {
  categories: CategoryOption[];
  categoryId: string;
  title: string;
  /** Existing product slug improves laptop override lookup on edit. */
  slugHint?: string;
  initialFacets?: Record<string, string> | null;
  onChange: (facets: Record<string, string>) => void;
}) {
  const categorySlug =
    categories.find((entry) => entry.id === categoryId)?.slug ?? "";
  const config = getCategoryFacetConfig(categorySlug);

  const suggested = useMemo(() => {
    if (!categorySlug || !title.trim()) return {};
    return extractProductFacets({
      slug: slugHint,
      title: title.trim(),
      categorySlug,
    });
  }, [categorySlug, title, slugHint]);

  const [values, setValues] = useState<Record<string, string>>(() =>
    mergeFacetOverrides(suggested, initialFacets ?? null),
  );
  const [touched, setTouched] = useState(false);

  // When category/title change and admin has not edited yet, follow autofill.
  useEffect(() => {
    if (touched) return;
    const next = mergeFacetOverrides(suggested, initialFacets ?? null);
    setValues(next);
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-autofill from title/category
  }, [suggested, initialFacets, touched]);

  if (!config || config.facets.length === 0) {
    return (
      <p className="sm:col-span-2 text-xs text-muted">
        Pick a PC category to set browse filters (socket, VRAM, wattage, …).
        Values autofill from the title; edit any field before saving.
      </p>
    );
  }

  function setFacet(key: string, value: string) {
    setTouched(true);
    const next = { ...values };
    if (!value.trim()) delete next[key];
    else next[key] = value.trim();
    setValues(next);
    onChange(next);
  }

  function refillFromTitle() {
    setTouched(false);
    const next = { ...suggested };
    setValues(next);
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
          onClick={refillFromTitle}
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
