"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  MEGA_MENU,
  POPULAR_NAV,
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
        d="M6 8h12l-1 12H7L6 8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V7a3 3 0 016 0v1"
        stroke="currentColor"
        strokeWidth="1.8"
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

function MegaPanel({
  columns,
  onNavigate,
}: {
  columns: MegaMenuColumn[];
  onNavigate: () => void;
}) {
  return (
    <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-surface shadow-[var(--shadow-mega)]">
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
      className="relative hidden border-t border-[#eee] bg-white md:block"
      onMouseLeave={scheduleClose}
    >
      <nav
        aria-label="Categories"
        className="meesho-cat-nav mx-auto flex h-10 max-w-[90rem] items-center gap-0 overflow-x-auto px-4 text-[12px] text-[#333] md:px-6 lg:justify-between"
      >
        <Link
          href={POPULAR_NAV.href}
          className="shrink-0 px-1.5 py-2 whitespace-nowrap hover:text-accent lg:px-1"
          onMouseEnter={scheduleClose}
        >
          {POPULAR_NAV.label}
        </Link>
        {MEGA_MENU.map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            className={`shrink-0 px-1.5 py-2 whitespace-nowrap hover:text-accent lg:px-1 ${
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
    <div ref={wrapRef} className="relative min-w-0 flex-1">
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
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <SearchIcon />
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
            className="w-full rounded-md border border-[#d4d4d4] bg-white py-2.5 pr-4 pl-10 text-sm outline-none placeholder:text-[#999] focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

export function SiteHeaderClient({
  cartCount,
  accountHref,
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

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 100);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur-md transition-all duration-300 ease-out ${
        compact ? "shadow-[var(--shadow-card)]" : ""
      }`}
      data-compact={compact ? "true" : "false"}
    >
      <div
        className={`container-shell flex items-center gap-3 transition-all duration-300 ease-out md:gap-5 ${
          compact ? "h-12 py-2 md:h-14" : "h-[var(--header-height)]"
        }`}
      >
        <Link
          href="/"
          className={`shrink-0 font-sans text-[1.65rem] font-bold tracking-tight text-[#9f2089] lowercase transition-all duration-300 ease-out ${
            compact ? "text-xl md:text-[1.45rem]" : "md:text-[1.75rem]"
          }`}
          style={{ fontFamily: "var(--font-geist-sans), DM Sans, sans-serif" }}
        >
          aspera
        </Link>
        <div className="hidden min-w-0 flex-1 md:block">
          <HeaderSearch />
        </div>
        <nav aria-label="Primary" className="ml-auto flex items-center gap-0 text-sm">
          <Link
            href={sellHref}
            className="hidden px-3 py-1.5 text-[13px] text-[#333] hover:text-accent sm:inline"
          >
            Become a Supplier
          </Link>
          <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
          <Link
            href="/about"
            className="hidden px-3 py-1.5 text-[13px] text-[#333] hover:text-accent md:inline"
          >
            Investor Relations
          </Link>
          <span className="hidden h-5 w-px bg-border md:block" aria-hidden />
          {showAdmin ? (
            <Link
              href="/admin/sellers"
              className="hidden px-3 py-1.5 text-[13px] text-[#333] hover:text-accent lg:inline"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className="inline-flex min-w-[3.25rem] flex-col items-center gap-0.5 px-2.5 py-1 text-[#333] hover:text-accent"
          >
            <UserIcon className="h-[22px] w-[22px]" />
            <span className="text-[11px] leading-none">Profile</span>
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex min-w-[3.25rem] flex-col items-center gap-0.5 px-2.5 py-1 text-[#333] hover:text-accent"
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <BagIcon className="h-[22px] w-[22px]" />
            <span className="text-[11px] leading-none">Cart</span>
            {cartCount > 0 ? (
              <span className="absolute top-0 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
      <div className={`container-shell md:hidden ${compact ? "hidden" : "pb-2.5"}`}>
        <HeaderSearch />
      </div>
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          compact ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
        }`}
      >
        <CategoryNav />
      </div>
      <div
        className={`flex items-center gap-2 border-t border-border/60 px-3 py-2 md:hidden ${
          compact ? "hidden" : ""
        }`}
      >
        <MobileCategoryDrawer />
        <nav
          aria-label="Mobile category shortcuts"
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto text-xs"
        >
          {POPULAR_NAV ? (
            <Link
              href={POPULAR_NAV.href}
              className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 font-medium whitespace-nowrap text-[#333]"
            >
              {POPULAR_NAV.label}
            </Link>
          ) : null}
          {MEGA_MENU.map((entry) => (
            <Link
              key={entry.key}
              href={entry.href}
              className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 whitespace-nowrap"
            >
              {entry.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
