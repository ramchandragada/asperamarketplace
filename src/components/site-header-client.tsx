"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  MEGA_MENU,
  SEARCH_PLACEHOLDER,
  TRENDING_SEARCHES,
  type MegaMenuColumn,
} from "@/lib/mega-menu";
import { MobileCategoryDrawer } from "@/components/mobile-category-drawer";
import { ScrollEdgeRail } from "@/components/product-loop-rail";

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 11H7L6 8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V7a3 3 0 0 1 6 0v1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrdersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7h10v12H7V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V5.5A3 3 0 0 1 15 5.5V7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 12h4M10 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MegaPanel({
  columns,
  onNavigate,
}: {
  columns: MegaMenuColumn[];
  onNavigate: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-full z-50 border-b border-[#E3E8E8] bg-white shadow-[var(--shadow-mega)]">
      <ScrollEdgeRail
        label="Subcategories"
        className="hide-scroll flex w-full gap-8 overflow-x-auto px-4 py-6 md:gap-10 md:px-6 lg:px-8 xl:gap-12 xl:px-10"
      >
        {columns.map((column) => (
          <div key={column.heading} className="min-w-[9.5rem] shrink-0">
            <p className="text-[13px] leading-none font-bold text-accent">
              {column.heading}
            </p>
            <ul className="mt-3 space-y-2.5">
              {column.links.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="block text-[13px] leading-snug text-[#666] hover:text-accent"
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </ScrollEdgeRail>
    </div>
  );
}

function CategoryNav() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function open(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenKey(key);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 160);
  }

  const active = MEGA_MENU.find((entry) => entry.key === openKey) ?? null;

  return (
    <div
      className="relative hidden w-full border-t border-[#E3E8E8] bg-white md:block"
      onMouseLeave={scheduleClose}
    >
      <nav aria-label="Categories">
        <ScrollEdgeRail
          label="Category list"
          className="hide-scroll flex h-12 w-full items-stretch justify-between gap-1 overflow-x-auto px-4 text-[13px] font-medium text-foreground md:px-6 lg:gap-0 lg:px-8 xl:px-10 xl:text-[14px]"
        >
          {MEGA_MENU.map((entry) => {
            const isActive = openKey === entry.key;
            return (
              <Link
                key={entry.key}
                href={entry.href}
                className={`inline-flex shrink-0 items-center border-b-[3px] px-1.5 whitespace-nowrap transition-colors hover:text-accent xl:px-2 ${
                  isActive
                    ? "border-accent font-semibold text-accent"
                    : "border-transparent"
                }`}
                onMouseEnter={() => open(entry.key)}
                onFocus={() => open(entry.key)}
                aria-expanded={isActive}
              >
                {entry.label}
              </Link>
            );
          })}
        </ScrollEdgeRail>
      </nav>
      {active ? (
        <div onMouseEnter={() => open(active.key)}>
          <MegaPanel columns={active.columns} onNavigate={() => setOpenKey(null)} />
        </div>
      ) : null}
    </div>
  );
}

function subscribeRecent(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("aspera-recent-searches", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("aspera-recent-searches", onStoreChange);
  };
}

function getRecentSnapshot() {
  try {
    return localStorage.getItem("aspera.recentSearches") ?? "[]";
  } catch {
    return "[]";
  }
}

type SuggestItem = {
  id: string;
  slug: string;
  title: string;
};

function HeaderSearch({ inputId = "global-search" }: { inputId?: string }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const recentRaw = useSyncExternalStore(
    subscribeRecent,
    getRecentSnapshot,
    () => "[]",
  );
  const recent = (() => {
    try {
      return JSON.parse(recentRaw) as string[];
    } catch {
      return [] as string[];
    }
  })();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const q = query.trim();
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      void (async () => {
        try {
          const response = await fetch(
            `/api/catalogue/suggest?q=${encodeURIComponent(q)}`,
          );
          const body = (await response.json()) as {
            data?: { suggestions?: SuggestItem[] };
          };
          if (!cancelled) {
            setSuggestions((body.data?.suggestions ?? []).slice(0, 5));
          }
        } catch {
          if (!cancelled) setSuggestions([]);
        }
      })();
    }, q.length < 2 ? 0 : 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function remember(term: string) {
    const next = [term, ...recent.filter((entry) => entry !== term)].slice(0, 6);
    try {
      localStorage.setItem("aspera.recentSearches", JSON.stringify(next));
      window.dispatchEvent(new Event("aspera-recent-searches"));
    } catch {
      /* ignore */
    }
  }

  function onSubmit() {
    const value = query.trim();
    if (value) remember(value);
    setFocused(false);
  }

  const showPanel = focused;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        action="/browse"
        method="get"
        role="search"
        onSubmit={() => onSubmit()}
      >
        <label className="sr-only" htmlFor={inputId}>
          Search products
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">
            <SearchIcon className="h-[18px] w-[18px]" />
          </span>
          <input
            id={inputId}
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={SEARCH_PLACEHOLDER}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            className="h-12 w-full rounded-full border border-border bg-white py-2.5 pr-24 pl-11 text-base text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none placeholder:text-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/25 md:text-[14px]"
          />
          <button
            type="submit"
            className="absolute top-1 right-1 bottom-1 inline-flex items-center rounded-full bg-brand-accent px-3.5 text-[13px] font-semibold text-white"
          >
            Search
          </button>
        </div>
      </form>
      {showPanel ? (
        <div
          id={listId}
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-mega)]"
        >
          {recent.length > 0 ? (
            <div className="border-b border-border px-3 py-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                Recent
              </p>
              <ul className="mt-1">
                {recent.map((term) => (
                  <li key={term}>
                    <Link
                      href={`/browse?q=${encodeURIComponent(term)}`}
                      className="flex min-h-11 items-center rounded px-2 py-1.5 text-base hover:bg-accent-soft md:min-h-0 md:text-sm"
                      onClick={() => setFocused(false)}
                    >
                      {term}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              Trending
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <li key={term}>
                  <Link
                    href={`/browse?q=${encodeURIComponent(term)}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-border px-2.5 py-1 text-sm hover:border-accent hover:text-accent md:min-h-0 md:text-xs"
                    onClick={() => {
                      remember(term);
                      setFocused(false);
                    }}
                  >
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {suggestions.length > 0 ? (
            <div className="border-t border-border px-3 py-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                Suggestions
              </p>
              <ul className="mt-1">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/products/${item.slug}`}
                      className="flex min-h-11 items-center rounded px-2 py-1.5 text-base hover:bg-accent-soft md:min-h-0 md:text-sm"
                      onClick={() => setFocused(false)}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="border-t border-border px-3 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              Categories
            </p>
            <ul className="mt-1 grid grid-cols-2 gap-1">
              {MEGA_MENU.slice(0, 6).map((entry) => (
                <li key={entry.key}>
                  <Link
                    href={entry.href}
                    className="flex min-h-11 items-center rounded px-2 py-1.5 text-base hover:bg-accent-soft md:min-h-0 md:text-sm"
                    onClick={() => setFocused(false)}
                  >
                    {entry.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Enter compact after this scroll; exit only after scrolling back well below. */
const COMPACT_ENTER_Y = 96;
const COMPACT_EXIT_Y = 32;

export function SiteHeaderClient({
  cartCount,
  accountHref,
  accountLabel,
  sellHref,
  showAdmin,
}: {
  cartCount: number;
  accountHref: string;
  accountLabel: string;
  sellHref: string;
  showAdmin: boolean;
}) {
  const [compact, setCompact] = useState(false);
  const compactRef = useRef(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    function onScroll() {
      // Phones keep one header height for the whole scroll. Hiding the search
      // row and category chips shrank the sticky box by ~135px; mobile
      // browsers then rewound scrollY and the bar flickered.
      if (!desktop.matches) {
        if (compactRef.current) {
          compactRef.current = false;
          setCompact(false);
        }
        return;
      }
      const y = window.scrollY;
      // Hysteresis stops the desktop row (72px → 56px) from oscillating.
      const next =
        compactRef.current ? y > COMPACT_EXIT_Y : y > COMPACT_ENTER_Y;
      if (next === compactRef.current) return;
      compactRef.current = next;
      setCompact(next);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <>
      <div className="w-full bg-[linear-gradient(90deg,#123b4a_0%,#1a5348_58%,#9a4a28_100%)] text-accent-foreground">
        <p className="flex h-8 w-full items-center justify-center px-4 text-center text-[12px] font-medium tracking-wide md:h-9 md:px-8 md:text-[13px]">
          <span className="flex items-center justify-center gap-1.5 whitespace-nowrap md:hidden">
            <span>Free delivery</span>
            <span aria-hidden>·</span>
            <span>Easy returns</span>
            <span aria-hidden>·</span>
            <span>Secure checkout</span>
          </span>
          <span className="hidden md:inline">
            Free delivery on eligible orders · Easy returns · Secure checkout
          </span>
        </p>
      </div>
    <header
      className={`sticky top-0 z-40 w-full border-border/80 bg-surface [overflow-anchor:none] max-md:border-b-0 md:border-b md:bg-surface/95 md:backdrop-blur-md ${
        compact ? "md:shadow-[0_1px_3px_rgba(18,59,74,0.08)]" : ""
      }`}
      data-compact={compact ? "true" : "false"}
    >
      <div
        className={`flex h-[72px] w-full items-center gap-4 px-4 md:gap-6 md:px-6 lg:px-8 xl:px-10 ${
          compact ? "md:h-14" : ""
        }`}
      >
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center font-bold text-[22px] leading-none tracking-tight text-accent md:text-[24px]"
        >
          Aspera
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <HeaderSearch />
        </div>

        <nav
          aria-label="Primary"
          className="ml-auto flex shrink-0 items-center gap-0 md:gap-5 lg:gap-6"
        >
          <Link
            href={sellHref}
            className="hidden min-h-11 items-center px-1 text-[14px] font-medium text-foreground hover:text-accent sm:inline-flex"
          >
            Become a seller
          </Link>
          {showAdmin ? (
            <Link
              href="/admin"
              className="hidden min-h-11 items-center px-1 text-[14px] font-medium text-foreground hover:text-accent lg:inline-flex"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className="inline-flex min-h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 text-foreground hover:text-accent"
          >
            <UserIcon className="h-5 w-5" />
            <span className="text-[12px] leading-none">{accountLabel}</span>
          </Link>
          <Link
            href="/orders"
            className="hidden min-h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 text-foreground hover:text-accent sm:inline-flex"
          >
            <OrdersIcon className="h-5 w-5" />
            <span className="text-[12px] leading-none">Orders</span>
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex min-h-11 min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 text-foreground hover:text-accent"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <BagIcon className="h-5 w-5" />
            <span className="text-[12px] leading-none">Cart</span>
            {cartCount > 0 ? (
              <span className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>

      <CategoryNav />
    </header>
    {/* Search and category chips stay in normal flow on phones. Putting them
        inside the sticky header and then hiding them on scroll changed the
        stuck bar's height and made mobile browsers rewind the page. */}
    <div className="border-b border-border/80 bg-surface md:hidden">
      <div className="w-full px-4 pb-2.5">
        <HeaderSearch inputId="global-search-mobile" />
      </div>
      <div className="flex w-full items-center gap-2 border-t border-border px-3 py-2">
        <MobileCategoryDrawer />
        <nav
          aria-label="Mobile category shortcuts"
          className="hide-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto overscroll-x-contain text-xs"
        >
          {MEGA_MENU.map((entry) => (
            <Link
              key={entry.key}
              href={entry.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-background px-3 text-[13px] font-medium whitespace-nowrap shadow-[inset_0_0_0_1px_var(--border)] hover:text-accent"
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
    </>
  );
}
