"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition, type ReactNode } from "react";
import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export type BrowseProduct = ProductCardModel & {
  summary: string;
  categoryName: string;
};

type CategoryOption = { slug: string; name: string; productCount?: number };

const PRICE_PRESETS = [
  { key: "u200", label: "Under ₹200", min: 0, max: 200 },
  { key: "200-500", label: "₹200 – ₹500", min: 200, max: 500 },
  { key: "500-1000", label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { key: "a1000", label: "Above ₹1,000", min: 1000, max: null as number | null },
] as const;

const RATING_OPTIONS = [
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
  { value: 2, label: "2★ & above" },
] as const;

const DISCOUNT_OPTIONS = [
  { value: 10, label: "10% or more" },
  { value: 20, label: "20% or more" },
  { value: 30, label: "30% or more" },
  { value: 40, label: "40% or more" },
] as const;

export function CatalogueBrowse({
  initialItems,
  initialQuery,
  initialTotal,
  categories,
  initialCategorySlug = "",
  initialSort = "newest",
  initialInStockOnly = false,
  initialVerifiedOnly = false,
  initialMinRating,
  initialMinDiscount,
  heading,
  browseBasePath = "/browse",
}: {
  initialItems: BrowseProduct[];
  initialQuery: string;
  initialTotal: number;
  categories: CategoryOption[];
  initialCategorySlug?: string;
  initialSort?: string;
  initialInStockOnly?: boolean;
  initialVerifiedOnly?: boolean;
  initialMinRating?: number;
  initialMinDiscount?: number;
  heading?: string;
  browseBasePath?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [sort, setSort] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly);
  const [minRating, setMinRating] = useState<number | null>(
    initialMinRating ?? null,
  );
  const [minDiscount, setMinDiscount] = useState<number | null>(
    initialMinDiscount ?? null,
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePreset, setPricePreset] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    price: true,
    rating: true,
    discount: true,
    seller: true,
    availability: true,
  });

  const categoryName =
    categories.find((entry) => entry.slug === categorySlug)?.name ?? heading ?? "All products";

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string; clear: () => void }> = [];
    if (query.trim()) {
      list.push({
        key: "q",
        label: query.trim(),
        clear: () => setQuery(""),
      });
    }
    if (categorySlug) {
      list.push({
        key: "cat",
        label: categoryName,
        clear: () => setCategorySlug(""),
      });
    }
    if (pricePreset) {
      const preset = PRICE_PRESETS.find((entry) => entry.key === pricePreset);
      if (preset) {
        list.push({
          key: "price",
          label: preset.label,
          clear: () => {
            setPricePreset("");
            setMinPrice("");
            setMaxPrice("");
          },
        });
      }
    } else if (minPrice || maxPrice) {
      list.push({
        key: "priceCustom",
        label: `₹${minPrice || "0"}–₹${maxPrice || "∞"}`,
        clear: () => {
          setMinPrice("");
          setMaxPrice("");
        },
      });
    }
    if (minRating != null) {
      list.push({
        key: "rating",
        label: `${minRating}★ & above`,
        clear: () => setMinRating(null),
      });
    }
    if (minDiscount != null) {
      list.push({
        key: "discount",
        label: `${minDiscount}% or more`,
        clear: () => setMinDiscount(null),
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
  }, [
    query,
    categorySlug,
    categoryName,
    inStockOnly,
    verifiedOnly,
    pricePreset,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
  ]);

  async function runSearch(next?: {
    q?: string;
    categorySlug?: string;
    sort?: string;
    inStockOnly?: boolean;
    verifiedOnly?: boolean;
    minPrice?: string;
    maxPrice?: string;
    minRating?: number | null;
    minDiscount?: number | null;
  }) {
    setError(null);
    const params = new URLSearchParams();
    const q = (next?.q ?? query).trim();
    const cat = next?.categorySlug ?? categorySlug;
    const sortValue = next?.sort ?? sort;
    const stock = next?.inStockOnly ?? inStockOnly;
    const verified = next?.verifiedOnly ?? verifiedOnly;
    const min = next?.minPrice ?? minPrice;
    const max = next?.maxPrice ?? maxPrice;
    const rating = next?.minRating !== undefined ? next.minRating : minRating;
    const discount =
      next?.minDiscount !== undefined ? next.minDiscount : minDiscount;
    if (q) params.set("q", q);
    if (cat) params.set("categorySlug", cat);
    if (sortValue) params.set("sort", sortValue);
    if (stock) params.set("inStockOnly", "true");
    if (verified) params.set("verifiedSellerOnly", "true");
    if (min.trim()) {
      params.set("minPricePaise", String(Math.round(Number(min) * 100)));
    }
    if (max.trim()) {
      params.set("maxPricePaise", String(Math.round(Number(max) * 100)));
    }
    if (rating != null) {
      params.set("minRating", String(rating));
    }
    if (discount != null) {
      params.set("minDiscountPercent", String(discount));
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

  function applyAndClose() {
    startTransition(() => {
      void runSearch();
      setFiltersOpen(false);
    });
  }

  function clearAll() {
    setQuery("");
    setCategorySlug("");
    setSort("newest");
    setInStockOnly(false);
    setVerifiedOnly(false);
    setMinRating(null);
    setMinDiscount(null);
    setMinPrice("");
    setMaxPrice("");
    setPricePreset("");
    startTransition(() => {
      void runSearch({
        q: "",
        categorySlug: "",
        sort: "newest",
        inStockOnly: false,
        verifiedOnly: false,
        minPrice: "",
        maxPrice: "",
        minRating: null,
        minDiscount: null,
      });
    });
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void runSearch();
    });
  }

  const filterPanel = (
    <div className="flex flex-col gap-1">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Filters</h2>
        <button
          type="button"
          className="text-xs font-medium text-accent hover:underline"
          onClick={clearAll}
        >
          Clear all
        </button>
      </div>

      <FilterSection
        title="Category"
        open={openSections.category !== false}
        onToggle={() => toggleSection("category")}
      >
        <ul className="space-y-1.5">
          {categories.map((category) => (
            <li key={category.slug}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="category"
                  checked={categorySlug === category.slug}
                  onChange={() => {
                    setCategorySlug(category.slug);
                    startTransition(() => {
                      void runSearch({ categorySlug: category.slug });
                    });
                  }}
                />
                {category.name}
                {category.productCount != null
                  ? ` (${category.productCount})`
                  : ""}
              </label>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => {
                setCategorySlug("");
                startTransition(() => {
                  void runSearch({ categorySlug: "" });
                });
              }}
            >
              All categories
            </button>
          </li>
        </ul>
      </FilterSection>

      <FilterSection
        title="Price range"
        open={openSections.price !== false}
        onToggle={() => toggleSection("price")}
      >
        <ul className="space-y-1.5">
          {PRICE_PRESETS.map((preset) => (
            <li key={preset.key}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="price"
                  checked={pricePreset === preset.key}
                  onChange={() => {
                    setPricePreset(preset.key);
                    setMinPrice(String(preset.min));
                    setMaxPrice(preset.max == null ? "" : String(preset.max));
                    startTransition(() => {
                      void runSearch({
                        minPrice: String(preset.min),
                        maxPrice: preset.max == null ? "" : String(preset.max),
                      });
                    });
                  }}
                />
                {preset.label}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-xs">
            Min ₹
            <input
              inputMode="decimal"
              value={minPrice}
              onChange={(event) => {
                setPricePreset("");
                setMinPrice(event.target.value);
              }}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1.5"
            />
          </label>
          <label className="text-xs">
            Max ₹
            <input
              inputMode="decimal"
              value={maxPrice}
              onChange={(event) => {
                setPricePreset("");
                setMaxPrice(event.target.value);
              }}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1.5"
            />
          </label>
        </div>
      </FilterSection>

      <FilterSection
        title="Customer Rating"
        open={openSections.rating !== false}
        onToggle={() => toggleSection("rating")}
      >
        <ul className="space-y-1.5">
          {RATING_OPTIONS.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === option.value}
                  onChange={() => {
                    setMinRating(option.value);
                    startTransition(() => {
                      void runSearch({ minRating: option.value });
                    });
                  }}
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection
        title="Discount"
        open={openSections.discount !== false}
        onToggle={() => toggleSection("discount")}
      >
        <ul className="space-y-1.5">
          {DISCOUNT_OPTIONS.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="discount"
                  checked={minDiscount === option.value}
                  onChange={() => {
                    setMinDiscount(option.value);
                    startTransition(() => {
                      void runSearch({ minDiscount: option.value });
                    });
                  }}
                />
                {option.label}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection
        title="Seller"
        open={openSections.seller !== false}
        onToggle={() => toggleSection("seller")}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => {
              setVerifiedOnly(event.target.checked);
              startTransition(() => {
                void runSearch({ verifiedOnly: event.target.checked });
              });
            }}
          />
          Verified sellers only
        </label>
      </FilterSection>

      <FilterSection
        title="Availability"
        open={openSections.availability !== false}
        onToggle={() => toggleSection("availability")}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => {
              setInStockOnly(event.target.checked);
              startTransition(() => {
                void runSearch({ inStockOnly: event.target.checked });
              });
            }}
          />
          In stock only
        </label>
      </FilterSection>

      <Button type="button" className="mt-3" onClick={applyAndClose}>
        Apply filters
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link href="/" className="hover:text-accent">
            Home
          </Link>
          <span aria-hidden> › </span>
          <span className="text-foreground">{categoryName}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {query.trim() ? `Results for “${query.trim()}”` : categoryName}
          </h1>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                startTransition(() => {
                  void runSearch({ sort: event.target.value });
                });
              }}
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-muted">
          Showing {items.length === 0 ? 0 : 1}–{items.length} of {total} products
        </p>
      </div>

      <form onSubmit={onSearch} className="flex gap-2 md:hidden">
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products"
          className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm"
        />
        <Button type="button" variant="secondary" onClick={() => setFiltersOpen(true)}>
          Filter
        </Button>
      </form>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Applied:</span>
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
                    minPrice:
                      chip.key === "price" || chip.key === "priceCustom"
                        ? ""
                        : minPrice,
                    maxPrice:
                      chip.key === "price" || chip.key === "priceCustom"
                        ? ""
                        : maxPrice,
                    minRating: chip.key === "rating" ? null : minRating,
                    minDiscount: chip.key === "discount" ? null : minDiscount,
                  });
                });
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs hover:border-accent"
            >
              {chip.label} ✕
            </button>
          ))}
          <button
            type="button"
            className="text-xs font-medium text-accent hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      ) : null}

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-[var(--shadow-mega)]">
            {filterPanel}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-[var(--radius)] border border-border bg-surface p-4">
            {filterPanel}
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {pending ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products found"
              description="Try clearing filters or searching a broader term."
              action={
                <Link
                  href={browseBasePath}
                  className="text-sm font-medium text-accent underline"
                >
                  Continue shopping
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border py-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold"
        onClick={onToggle}
        aria-expanded={open}
      >
        {title}
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
