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
import Image from "next/image";

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
      <div className="container-shell grid gap-6 py-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {columns.map((column) => (
          <div key={column.heading}>
            <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
              {column.heading}
            </p>
            <ul className="mt-2 space-y-1.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-sm text-muted hover:text-accent"
                    onClick={onNavigate}
                  >
                    {link.imageUrl ? (
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-accent-soft">
                        <Image
                          src={link.imageUrl}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </span>
                    ) : null}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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
      className="relative hidden border-t border-[#E3E8E8] bg-white md:block"
      onMouseLeave={scheduleClose}
    >
      <nav
        aria-label="Categories"
        className="hide-scroll mx-auto flex h-12 max-w-[80rem] items-center justify-start gap-3 overflow-x-auto px-4 text-[14px] font-medium text-foreground md:px-8 lg:justify-between lg:gap-0"
      >
        {MEGA_MENU.map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            className={`shrink-0 px-1.5 py-2 whitespace-nowrap hover:text-accent ${
              openKey === entry.key ? "text-accent" : ""
            }`}
            onMouseEnter={() => open(entry.key)}
            onFocus={() => open(entry.key)}
            aria-expanded={openKey === entry.key}
          >
            {entry.label}
          </Link>
        ))}
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

function HeaderSearch() {
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
        <label className="sr-only" htmlFor="global-search">
          Search products
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">
            <SearchIcon className="h-[18px] w-[18px]" />
          </span>
          <input
            id="global-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            placeholder={SEARCH_PLACEHOLDER}
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            className="h-11 w-full rounded-[8px] border border-border bg-white py-2.5 pr-4 pl-10 text-[14px] text-foreground outline-none placeholder:text-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/25"
          />
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
                      className="block rounded px-2 py-1.5 text-sm hover:bg-accent-soft"
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
                    className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs hover:border-accent hover:text-accent"
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
                      className="block rounded px-2 py-1.5 text-sm hover:bg-accent-soft"
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
                    className="block rounded px-2 py-1.5 text-sm hover:bg-accent-soft"
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
    function onScroll() {
      const y = window.scrollY;
      // Hysteresis stops the sticky header height from oscillating around a
      // single threshold (height change → scrollY shift → flicker loop).
      const next =
        compactRef.current ? y > COMPACT_EXIT_Y : y > COMPACT_ENTER_Y;
      if (next === compactRef.current) return;
      compactRef.current = next;
      setCompact(next);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="bg-accent text-accent-foreground">
        <p className="mx-auto flex h-8 max-w-[80rem] items-center justify-center px-4 text-center text-[12px] font-medium tracking-wide md:h-9 md:px-8 md:text-[13px]">
          Free delivery on eligible orders · Easy returns · Secure checkout
        </p>
      </div>
    <header
      className={`sticky top-0 z-40 border-b border-border bg-surface ${
        compact ? "shadow-[0_1px_3px_rgba(18,59,74,0.08)]" : ""
      }`}
      data-compact={compact ? "true" : "false"}
    >
      <div
        className={`mx-auto flex w-full max-w-[80rem] items-center gap-4 px-4 md:gap-6 md:px-8 ${
          compact ? "h-14" : "h-[72px]"
        }`}
      >
        <Link
          href="/"
          className="shrink-0 font-bold text-[22px] leading-none tracking-tight text-accent md:w-[148px] md:text-[24px]"
        >
          Aspera
        </Link>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="mx-auto w-full max-w-[36rem] lg:max-w-[37.5rem]">
            <HeaderSearch />
          </div>
        </div>

        <nav
          aria-label="Primary"
          className="ml-auto flex shrink-0 items-center gap-0 md:gap-6"
        >
          <Link
            href={sellHref}
            className="hidden min-h-11 items-center px-1 text-[14px] font-medium text-foreground hover:text-accent sm:inline-flex"
          >
            Become a seller
          </Link>
          {showAdmin ? (
            <Link
              href="/admin/sellers"
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

      <div
        className={`mx-auto w-full max-w-[80rem] px-4 md:hidden md:px-8 ${
          compact ? "hidden" : "pb-2.5"
        }`}
      >
        <HeaderSearch />
      </div>

      {/* Keep category rail mounted and full-height — collapsing it with
          max-height/opacity on scroll changed sticky header size and fought
          scrollY, which made the bar flicker. */}
      <CategoryNav />

      <div
        className={`flex items-center gap-2 border-t border-border px-3 py-2 md:hidden ${
          compact ? "hidden" : ""
        }`}
      >
        <MobileCategoryDrawer />
        <nav
          aria-label="Mobile category shortcuts"
          className="hide-scroll flex min-w-0 flex-1 gap-2 overflow-x-auto text-xs"
        >
          {MEGA_MENU.map((entry) => (
            <Link
              key={entry.key}
              href={entry.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-background px-3 text-[13px] font-medium whitespace-nowrap hover:border-accent hover:text-accent"
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
    </>
  );
}
