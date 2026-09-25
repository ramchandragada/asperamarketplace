"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export type BrowseProduct = ProductCardModel & {
  summary: string;
  categoryName: string;
};

type CategoryOption = { slug: string; name: string };

export function CatalogueBrowse({
  initialItems,
  initialQuery,
  initialTotal,
  categories,
  initialCategorySlug = "",
  initialSort = "newest",
  initialInStockOnly = false,
  initialVerifiedOnly = false,
}: {
  initialItems: BrowseProduct[];
  initialQuery: string;
  initialTotal: number;
  categories: CategoryOption[];
  initialCategorySlug?: string;
  initialSort?: string;
  initialInStockOnly?: boolean;
  initialVerifiedOnly?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [sort, setSort] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string; clear: () => void }> = [];
    if (query.trim()) {
      list.push({
        key: "q",
        label: `Search: ${query.trim()}`,
        clear: () => setQuery(""),
      });
    }
    if (categorySlug) {
      const name =
        categories.find((entry) => entry.slug === categorySlug)?.name ??
        categorySlug;
      list.push({
        key: "cat",
        label: name,
        clear: () => setCategorySlug(""),
      });
    }
    if (inStockOnly) {
      list.push({
        key: "stock",
        label: "In stock",
        clear: () => setInStockOnly(false),
      });
    }
    if (verifiedOnly) {
      list.push({
        key: "verified",
        label: "Verified sellers",
        clear: () => setVerifiedOnly(false),
      });
    }
    return list;
  }, [query, categorySlug, inStockOnly, verifiedOnly, categories]);

  async function runSearch(next?: {
    q?: string;
    categorySlug?: string;
    sort?: string;
    inStockOnly?: boolean;
    verifiedOnly?: boolean;
  }) {
    setError(null);
    const params = new URLSearchParams();
    const q = (next?.q ?? query).trim();
    const cat = next?.categorySlug ?? categorySlug;
    const sortValue = next?.sort ?? sort;
    const stock = next?.inStockOnly ?? inStockOnly;
    const verified = next?.verifiedOnly ?? verifiedOnly;
    if (q) params.set("q", q);
    if (cat) params.set("categorySlug", cat);
    if (sortValue) params.set("sort", sortValue);
    if (stock) params.set("inStockOnly", "true");
    if (verified) params.set("verifiedSellerOnly", "true");
    if (minPrice.trim()) {
      params.set("minPricePaise", String(Math.round(Number(minPrice) * 100)));
    }
    if (maxPrice.trim()) {
      params.set("maxPricePaise", String(Math.round(Number(maxPrice) * 100)));
    }
    params.set("pageSize", "24");

    const response = await fetch(`/api/catalogue/products?${params.toString()}`);
    const body = (await response.json()) as {
      data?: { items: BrowseProduct[]; total: number };
      message?: string;
    };
    if (!response.ok) {
      setError(body.message ?? "Search failed");
      return;
    }
    setItems(body.data?.items ?? []);
    setTotal(body.data?.total ?? 0);
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, "", url.toString());
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void runSearch();
    });
  }

  const filterPanel = (
    <div className="flex flex-col gap-4">
      <label className="text-sm">
        <span className="mb-1 block font-medium">Category</span>
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium">Sort</span>
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Min ₹</span>
          <input
            inputMode="decimal"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Max ₹</span>
          <input
            inputMode="decimal"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(event) => setInStockOnly(event.target.checked)}
        />
        In stock only
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(event) => setVerifiedOnly(event.target.checked)}
        />
        Verified sellers only
      </label>
      <Button
        type="button"
        onClick={() =>
          startTransition(() => {
            void runSearch();
            setFiltersOpen(false);
          })
        }
      >
        Apply filters
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-sm">
          <span className="sr-only">Search products</span>
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search approved listings"
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Searching…" : "Search"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="md:hidden"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
        >
          Filters
        </Button>
      </form>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                chip.clear();
                startTransition(() => {
                  void runSearch({
                    q: chip.key === "q" ? "" : query,
                    categorySlug: chip.key === "cat" ? "" : categorySlug,
                    inStockOnly: chip.key === "stock" ? false : inStockOnly,
                    verifiedOnly: chip.key === "verified" ? false : verifiedOnly,
                  });
                });
              }}
              className="inline-flex"
            >
              <Badge>
                {chip.label} ×
              </Badge>
            </button>
          ))}
        </div>
      ) : null}

      {filtersOpen ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 md:hidden">
          {filterPanel}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              Filters
            </h2>
            {filterPanel}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {total} listing{total === 1 ? "" : "s"}
          </p>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {pending ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No listings match"
              description="Try clearing filters or searching a broader term. Zero-result recovery keeps you shopping."
              action={
                <Link href="/browse" className="text-sm font-medium text-accent underline">
                  Reset browse
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
