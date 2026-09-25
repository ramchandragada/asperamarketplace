"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { ProductCard, type ProductCardModel } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCardSkeleton } from "@/components/ui/skeleton";

export type BrowseProduct = ProductCardModel & {
  summary: string;
  categoryName: string;
};

type CategoryOption = { slug: string; name: string; productCount?: number };
type BrandOption = { slug: string; name: string; productCount?: number };

const PRICE_PRESETS = [
  { key: "u200", label: "Under ₹200", min: 0, max: 200 },
  { key: "200-500", label: "₹200 – ₹500", min: 200, max: 500 },
  { key: "500-1000", label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { key: "a1000", label: "Above ₹1,000", min: 1000, max: null as number | null },
] as const;

const RATING_OPTIONS = [
  { value: 4, label: "4★ & above" },
  { value: 3, label: "3★ & above" },
] as const;

const DISCOUNT_OPTIONS = [
  { value: 10, label: "10%+" },
  { value: 20, label: "20%+" },
  { value: 30, label: "30%+" },
  { value: 40, label: "40%+" },
] as const;

const GENDER_OPTIONS = [
  { value: "boys", label: "Boys", categorySlug: "baby-kids", q: "boy" },
  { value: "girls", label: "Girls", categorySlug: "baby-kids", q: "girl" },
  { value: "men", label: "Men", categorySlug: "fashion", q: "shirt" },
  { value: "women", label: "Women", categorySlug: "fashion", q: "" },
] as const;

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Pink",
  "Yellow",
  "Beige",
] as const;

const FABRIC_OPTIONS = [
  "Cotton",
  "Silk",
  "Rayon",
  "Polyester",
  "Linen",
  "Wool",
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Customer rating" },
] as const;

function rupeesFromPaise(paise?: number) {
  if (paise == null || Number.isNaN(paise)) return "";
  return String(Math.round(paise / 100));
}

export function CatalogueBrowse({
  initialItems,
  initialQuery,
  initialTotal,
  categories,
  brands = [],
  initialCategorySlug = "",
  initialBrandSlug = "",
  initialSort = "newest",
  initialInStockOnly = false,
  initialVerifiedOnly = false,
  initialMinRating,
  initialMinDiscount,
  initialMinPricePaise,
  initialMaxPricePaise,
  heading,
  browseBasePath = "/browse",
  variant = "page",
  enableLoadMore = false,
  infiniteScroll = false,
  updateUrl = true,
}: {
  initialItems: BrowseProduct[];
  initialQuery: string;
  initialTotal: number;
  categories: CategoryOption[];
  brands?: BrandOption[];
  initialCategorySlug?: string;
  initialBrandSlug?: string;
  initialSort?: string;
  initialInStockOnly?: boolean;
  initialVerifiedOnly?: boolean;
  initialMinRating?: number;
  initialMinDiscount?: number;
  initialMinPricePaise?: number;
  initialMaxPricePaise?: number;
  heading?: string;
  browseBasePath?: string;
  /** `home` hides breadcrumb and uses Products For You chrome */
  variant?: "page" | "home";
  enableLoadMore?: boolean;
  /** Auto-load next page when sentinel enters viewport */
  infiniteScroll?: boolean;
  updateUrl?: boolean;
}) {
  const isHome = variant === "home";
  const useInfinite = infiniteScroll || (isHome && enableLoadMore);
  const initialMin = rupeesFromPaise(initialMinPricePaise);
  const initialMax = rupeesFromPaise(initialMaxPricePaise);
  const matchedPreset =
    PRICE_PRESETS.find(
      (preset) =>
        String(preset.min) === initialMin &&
        (preset.max == null ? initialMax === "" : String(preset.max) === initialMax),
    )?.key ?? "";

  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [brandSlug, setBrandSlug] = useState(initialBrandSlug);
  const [gender, setGender] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [fabric, setFabric] = useState<string>("");
  const [sort, setSort] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [verifiedOnly, setVerifiedOnly] = useState(initialVerifiedOnly);
  const [minRating, setMinRating] = useState<number | null>(
    initialMinRating ?? null,
  );
  const [minDiscount, setMinDiscount] = useState<number | null>(
    initialMinDiscount ?? null,
  );
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [pricePreset, setPricePreset] = useState(matchedPreset);
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [categoryShowAll, setCategoryShowAll] = useState(false);
  const [brandShowAll, setBrandShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true,
    gender: true,
    color: false,
    fabric: false,
    brand: true,
    price: true,
    rating: true,
    discount: true,
    seller: false,
    availability: false,
  });

  const categoryName =
    categories.find((entry) => entry.slug === categorySlug)?.name ??
    heading ??
    "All products";
  const brandName =
    brands.find((entry) => entry.slug === brandSlug)?.name ?? null;

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(term),
    );
  }, [categories, categorySearch]);

  const filteredBrands = useMemo(() => {
    const term = brandSearch.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(term));
  }, [brands, brandSearch]);

  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string }> = [];
    if (query.trim()) {
      list.push({ key: "q", label: query.trim() });
    }
    if (categorySlug) {
      list.push({ key: "cat", label: categoryName });
    }
    if (brandSlug && brandName) {
      list.push({ key: "brand", label: brandName });
    }
    if (pricePreset) {
      const preset = PRICE_PRESETS.find((entry) => entry.key === pricePreset);
      if (preset) list.push({ key: "price", label: preset.label });
    } else if (minPrice || maxPrice) {
      list.push({
        key: "priceCustom",
        label: `₹${minPrice || "0"}–₹${maxPrice || "∞"}`,
      });
    }
    if (minRating != null) {
      list.push({ key: "rating", label: `${minRating}★ & above` });
    }
    if (minDiscount != null) {
      list.push({ key: "discount", label: `${minDiscount}% or more` });
    }
    if (inStockOnly) {
      list.push({ key: "stock", label: "In stock" });
    }
    if (verifiedOnly) {
      list.push({ key: "verified", label: "Verified sellers" });
    }
    if (gender) {
      const option = GENDER_OPTIONS.find((entry) => entry.value === gender);
      if (option) list.push({ key: "gender", label: option.label });
    }
    if (color) list.push({ key: "color", label: color });
    if (fabric) list.push({ key: "fabric", label: fabric });
    return list;
  }, [
    query,
    categorySlug,
    categoryName,
    brandSlug,
    brandName,
    inStockOnly,
    verifiedOnly,
    pricePreset,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    gender,
    color,
    fabric,
  ]);

  async function runSearch(next?: {
    q?: string;
    categorySlug?: string;
    brandSlug?: string;
    sort?: string;
    inStockOnly?: boolean;
    verifiedOnly?: boolean;
    minPrice?: string;
    maxPrice?: string;
    minRating?: number | null;
    minDiscount?: number | null;
    page?: number;
    append?: boolean;
  }) {
    setError(null);
    const params = new URLSearchParams();
    const q = (next?.q ?? query).trim();
    const cat = next?.categorySlug ?? categorySlug;
    const brand = next?.brandSlug ?? brandSlug;
    const sortValue = next?.sort ?? sort;
    const stock = next?.inStockOnly ?? inStockOnly;
    const verified = next?.verifiedOnly ?? verifiedOnly;
    const min = next?.minPrice ?? minPrice;
    const max = next?.maxPrice ?? maxPrice;
    const rating = next?.minRating !== undefined ? next.minRating : minRating;
    const discount =
      next?.minDiscount !== undefined ? next.minDiscount : minDiscount;
    const nextPage = next?.page ?? 1;
    const append = next?.append === true;
    if (q) params.set("q", q);
    if (cat) params.set("categorySlug", cat);
    if (brand) params.set("brandSlug", brand);
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
    params.set("page", String(nextPage));
    params.set("pageSize", "24");

    if (append) setLoadingMore(true);

    const response = await fetch(`/api/catalogue/products?${params.toString()}`);
    const body = (await response.json()) as {
      data?: { items: BrowseProduct[]; total: number };
      message?: string;
    };
    if (append) setLoadingMore(false);
    if (!response.ok) {
      setError(body.message ?? "Search failed");
      return;
    }
    const nextItems = body.data?.items ?? [];
    setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
    setTotal(body.data?.total ?? 0);
    setPage(nextPage);
    if (updateUrl && !isHome) {
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, "", url.toString());
    }
  }

  function loadMore() {
    if (loadingMore || pending || items.length >= total) return;
    startTransition(() => {
      void runSearch({ page: page + 1, append: true });
    });
  }

  useEffect(() => {
    if (!useInfinite) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMore closes over latest page/items
  }, [useInfinite, items.length, total, loadingMore, pending, page]);

  function applyAndClose() {
    startTransition(() => {
      void runSearch();
      setFiltersOpen(false);
    });
  }

  function clearAll() {
    setQuery("");
    setCategorySlug("");
    setBrandSlug("");
    setSort(initialQuery.trim() ? "relevance" : "newest");
    setInStockOnly(false);
    setVerifiedOnly(false);
    setMinRating(null);
    setMinDiscount(null);
    setMinPrice("");
    setMaxPrice("");
    setPricePreset("");
    setCategorySearch("");
    setBrandSearch("");
    setGender("");
    setColor("");
    setFabric("");
    startTransition(() => {
      void runSearch({
        q: "",
        categorySlug: "",
        brandSlug: "",
        sort: initialQuery.trim() ? "relevance" : "newest",
        inStockOnly: false,
        verifiedOnly: false,
        minPrice: "",
        maxPrice: "",
        minRating: null,
        minDiscount: null,
      });
    });
  }

  function clearChip(key: string) {
    const next: Parameters<typeof runSearch>[0] = {};
    if (key === "q") {
      setQuery("");
      next.q = "";
    }
    if (key === "cat") {
      setCategorySlug("");
      next.categorySlug = "";
    }
    if (key === "brand") {
      setBrandSlug("");
      next.brandSlug = "";
    }
    if (key === "gender") {
      setGender("");
      setCategorySlug("");
      setQuery("");
      next.categorySlug = "";
      next.q = "";
    }
    if (key === "color") {
      setColor("");
      next.q = fabric || "";
      setQuery(fabric || "");
    }
    if (key === "fabric") {
      setFabric("");
      next.q = color || "";
      setQuery(color || "");
    }
    if (key === "price" || key === "priceCustom") {
      setPricePreset("");
      setMinPrice("");
      setMaxPrice("");
      next.minPrice = "";
      next.maxPrice = "";
    }
    if (key === "rating") {
      setMinRating(null);
      next.minRating = null;
    }
    if (key === "discount") {
      setMinDiscount(null);
      next.minDiscount = null;
    }
    if (key === "stock") {
      setInStockOnly(false);
      next.inStockOnly = false;
    }
    if (key === "verified") {
      setVerifiedOnly(false);
      next.verifiedOnly = false;
    }
    startTransition(() => {
      void runSearch(next);
    });
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void runSearch({
        sort: query.trim() && sort === "newest" ? "relevance" : sort,
      });
    });
  }

  const filterPanel = (
    <div className="flex flex-col">
      <label className="mb-3 flex items-center gap-2 border-b border-[#eee] pb-3 text-[13px] text-[#333]">
        <span className="text-[#666]">Sort by :</span>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            startTransition(() => {
              void runSearch({ sort: event.target.value, page: 1 });
            });
          }}
          className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-medium text-[#333] outline-none"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-1 flex items-baseline justify-between gap-2 pb-2">
        <div>
          <h2 className="text-[13px] font-bold tracking-[0.06em] text-[#333] uppercase">
            Filters
          </h2>
          <p className="mt-0.5 text-xs text-[#888]">
            {total >= 1000
              ? "1000+ Products"
              : `${total} Products`}
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-[#9f2089] hover:underline"
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
        <div className="relative mb-2">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[#999]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-md border border-[#ddd] bg-white py-1.5 pr-2.5 pl-8 text-[13px] outline-none placeholder:text-[#999] focus:border-[#9f2089]"
          />
        </div>
        <ul className="space-y-2">
          <li>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#333]">
              <input
                type="checkbox"
                checked={!categorySlug}
                onChange={() => {
                  setCategorySlug("");
                  startTransition(() => {
                    void runSearch({ categorySlug: "" });
                  });
                }}
                className="h-3.5 w-3.5 accent-[#9f2089]"
              />
              All categories
            </label>
          </li>
          {(categoryShowAll
            ? filteredCategories
            : filteredCategories.slice(0, 6)
          ).map((category) => (
            <li key={category.slug}>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#333]">
                <input
                  type="checkbox"
                  checked={categorySlug === category.slug}
                  onChange={() => {
                    const next =
                      categorySlug === category.slug ? "" : category.slug;
                    setCategorySlug(next);
                    startTransition(() => {
                      void runSearch({ categorySlug: next });
                    });
                  }}
                  className="h-3.5 w-3.5 accent-[#9f2089]"
                />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
              </label>
            </li>
          ))}
          {filteredCategories.length === 0 ? (
            <li className="text-xs text-[#888]">No categories match</li>
          ) : null}
        </ul>
        {filteredCategories.length > 6 ? (
          <button
            type="button"
            className="mt-2 text-[13px] font-medium text-[#9f2089] hover:underline"
            onClick={() => setCategoryShowAll((value) => !value)}
          >
            {categoryShowAll ? "Show Less" : "Show More"}
          </button>
        ) : null}
      </FilterSection>

      <FilterSection
        title="Gender"
        open={openSections.gender !== false}
        onToggle={() => toggleSection("gender")}
      >
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => {
            const active = gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                  active
                    ? "border-[#9f2089] bg-[#fce8f3] text-[#9f2089]"
                    : "border-[#ddd] bg-white text-[#333] hover:border-[#9f2089]"
                }`}
                onClick={() => {
                  if (active) {
                    setGender("");
                    setCategorySlug("");
                    setQuery("");
                    startTransition(() => {
                      void runSearch({ categorySlug: "", q: "" });
                    });
                    return;
                  }
                  setGender(option.value);
                  setCategorySlug(option.categorySlug);
                  setQuery(option.q);
                  startTransition(() => {
                    void runSearch({
                      categorySlug: option.categorySlug,
                      q: option.q,
                    });
                  });
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection
        title="Color"
        open={openSections.color === true}
        onToggle={() => toggleSection("color")}
      >
        <ul className="space-y-1.5">
          {COLOR_OPTIONS.map((option) => (
            <li key={option}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="color"
                  checked={color === option}
                  onChange={() => {
                    setColor(option);
                    const nextQ = [option, fabric].filter(Boolean).join(" ");
                    setQuery(nextQ);
                    startTransition(() => {
                      void runSearch({ q: nextQ });
                    });
                  }}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection
        title="Fabric"
        open={openSections.fabric === true}
        onToggle={() => toggleSection("fabric")}
      >
        <ul className="space-y-1.5">
          {FABRIC_OPTIONS.map((option) => (
            <li key={option}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="fabric"
                  checked={fabric === option}
                  onChange={() => {
                    setFabric(option);
                    const nextQ = [color, option].filter(Boolean).join(" ");
                    setQuery(nextQ);
                    startTransition(() => {
                      void runSearch({ q: nextQ });
                    });
                  }}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      </FilterSection>

      {brands.length > 0 ? (
        <FilterSection
          title="Brand"
          open={openSections.brand !== false}
          onToggle={() => toggleSection("brand")}
        >
          <input
            type="search"
            value={brandSearch}
            onChange={(event) => setBrandSearch(event.target.value)}
            placeholder="Search"
            className="mb-2 w-full rounded-md border border-[#ddd] bg-white px-2.5 py-1.5 text-[13px] outline-none placeholder:text-[#999] focus:border-[#9f2089]"
          />
          <ul className="space-y-2">
            {(brandShowAll ? filteredBrands : filteredBrands.slice(0, 6)).map(
              (brand) => (
                <li key={brand.slug}>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#333]">
                    <input
                      type="checkbox"
                      checked={brandSlug === brand.slug}
                      onChange={() => {
                        const next = brandSlug === brand.slug ? "" : brand.slug;
                        setBrandSlug(next);
                        startTransition(() => {
                          void runSearch({ brandSlug: next });
                        });
                      }}
                      className="h-3.5 w-3.5 accent-[#9f2089]"
                    />
                    <span className="min-w-0 flex-1 truncate">{brand.name}</span>
                  </label>
                </li>
              ),
            )}
            {filteredBrands.length === 0 ? (
              <li className="text-xs text-[#888]">No brands match</li>
            ) : null}
          </ul>
          {filteredBrands.length > 6 ? (
            <button
              type="button"
              className="mt-2 text-[13px] font-medium text-[#9f2089] hover:underline"
              onClick={() => setBrandShowAll((value) => !value)}
            >
              {brandShowAll ? "Show Less" : "Show More"}
            </button>
          ) : null}
        </FilterSection>
      ) : null}

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
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">
            Min ₹
            <input
              inputMode="decimal"
              value={minPrice}
              onChange={(event) => {
                setPricePreset("");
                setMinPrice(event.target.value);
              }}
              onBlur={() => {
                startTransition(() => {
                  void runSearch({ minPrice, maxPrice });
                });
              }}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted">
            Max ₹
            <input
              inputMode="decimal"
              value={maxPrice}
              onChange={(event) => {
                setPricePreset("");
                setMaxPrice(event.target.value);
              }}
              onBlur={() => {
                startTransition(() => {
                  void runSearch({ minPrice, maxPrice });
                });
              }}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs text-muted">
          Max price slider
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={maxPrice.trim() ? Number(maxPrice) || 0 : 5000}
            onChange={(event) => {
              const value = event.target.value;
              setPricePreset("");
              setMaxPrice(value === "5000" ? "" : value);
            }}
            onMouseUp={() => {
              startTransition(() => {
                void runSearch({
                  minPrice,
                  maxPrice: maxPrice.trim() ? maxPrice : "",
                });
              });
            }}
            onTouchEnd={() => {
              startTransition(() => {
                void runSearch({
                  minPrice,
                  maxPrice: maxPrice.trim() ? maxPrice : "",
                });
              });
            }}
            className="mt-2 w-full accent-[var(--accent)]"
          />
          <span className="mt-1 block text-[11px]">
            {maxPrice.trim() ? `Up to ₹${maxPrice}` : "Any price"}
          </span>
        </label>
      </FilterSection>

      <FilterSection
        title="Customer rating"
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
          {minRating != null ? (
            <li>
              <button
                type="button"
                className="text-xs text-accent hover:underline"
                onClick={() => {
                  setMinRating(null);
                  startTransition(() => {
                    void runSearch({ minRating: null });
                  });
                }}
              >
                Clear rating
              </button>
            </li>
          ) : null}
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
          {minDiscount != null ? (
            <li>
              <button
                type="button"
                className="text-xs text-accent hover:underline"
                onClick={() => {
                  setMinDiscount(null);
                  startTransition(() => {
                    void runSearch({ minDiscount: null });
                  });
                }}
              >
                Clear discount
              </button>
            </li>
          ) : null}
        </ul>
      </FilterSection>

      <FilterSection
        title="Seller"
        open={openSections.seller === true}
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
        open={openSections.availability === true}
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

      <Button type="button" className="mt-3 md:hidden" onClick={applyAndClose}>
        Show {total} result{total === 1 ? "" : "s"}
      </Button>
    </div>
  );

  return (
    <div className={`flex flex-col gap-5 ${isHome ? "pt-2" : ""}`}>
      <div className="flex flex-col gap-1">
        {!isHome ? (
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <span aria-hidden> › </span>
            <Link href={browseBasePath} className="hover:text-accent">
              Shop
            </Link>
            {categorySlug ? (
              <>
                <span aria-hidden> › </span>
                <span className="text-foreground">{categoryName}</span>
              </>
            ) : null}
          </nav>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className={`font-display font-semibold tracking-tight ${
                isHome ? "text-2xl md:text-3xl" : "text-3xl"
              }`}
            >
              {isHome
                ? (heading ?? "Products For You")
                : query.trim()
                  ? `Results for “${query.trim()}”`
                  : categoryName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {total >= 1000
                ? "1000+ Products"
                : `Showing ${items.length === 0 ? 0 : 1}–${items.length} of ${total} products`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort by:</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                startTransition(() => {
                  void runSearch({ sort: event.target.value, page: 1 });
                });
              }}
              className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-1.5 font-medium"
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <form onSubmit={onSearch} className="flex min-w-0 flex-1 gap-2">
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Saree, Kurti or Search by Product Code"
            className="min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm"
          />
        </form>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setFiltersOpen(true)}
        >
          Filter
          {chips.length > 0 ? ` (${chips.length})` : ""}
        </Button>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Applied:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => clearChip(chip.key)}
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
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="text-sm text-muted hover:text-foreground"
                onClick={() => setFiltersOpen(false)}
              >
                Close
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#eee] pr-4 lg:block">
          <div className="sticky top-24 bg-white py-1">{filterPanel}</div>
        </aside>

        <div className="flex flex-col gap-4">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {pending && !loadingMore ? (
            <div
              className={`grid grid-cols-2 gap-3 ${
                isHome
                  ? "md:grid-cols-3 xl:grid-cols-4"
                  : "md:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
              {useInfinite && items.length < total ? (
                <div
                  ref={sentinelRef}
                  className="flex flex-col items-center gap-3 py-4"
                  aria-hidden={!loadingMore}
                >
                  <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {(loadingMore || pending
                      ? [0, 1, 2, 3]
                      : []
                    ).map((index) => (
                      <ProductCardSkeleton key={`more-${index}`} />
                    ))}
                  </div>
                  {loadingMore ? (
                    <p className="text-xs font-medium text-muted">
                      Loading more products…
                    </p>
                  ) : null}
                </div>
              ) : null}
              {!useInfinite && enableLoadMore && items.length < total ? (
                <div className="flex justify-center pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No products found"
              description="Try clearing filters or searching a broader term."
              action={
                <Link
                  href={isHome ? "/shop" : browseBasePath}
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
    <div className="border-b border-[#eee] py-3.5">
      <button
        type="button"
        className="flex w-full items-center justify-between text-[13px] font-semibold text-[#333]"
        onClick={onToggle}
        aria-expanded={open}
      >
        {title}
        <span aria-hidden className="text-[10px] text-[#888]">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open ? <div className="mt-2.5">{children}</div> : null}
    </div>
  );
}
