"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";

export type BuyAgainItem = {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string | null;
  productSlug: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPricePaise: number;
  lastOrderedAt: string;
  timesOrdered: number;
  lastQuantity: number;
  available: boolean;
};

type TimeFilter = "last_30" | "last_90" | "this_year" | "all";

const TIME_FILTERS: Array<{ key: TimeFilter; label: string }> = [
  { key: "last_30", label: "Last 30 days" },
  { key: "last_90", label: "Last 90 days" },
  { key: "this_year", label: "This year" },
  { key: "all", label: "All time" },
];

function inTimeWindow(iso: string, filter: TimeFilter) {
  if (filter === "all") return true;
  const when = new Date(iso).getTime();
  const now = Date.now();
  if (filter === "last_30") return now - when <= 30 * 24 * 60 * 60 * 1000;
  if (filter === "last_90") return now - when <= 90 * 24 * 60 * 60 * 1000;
  return new Date(iso).getFullYear() === new Date().getFullYear();
}

export function BuyAgainPanel({ items }: { items: BuyAgainItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!inTimeWindow(item.lastOrderedAt, timeFilter)) return false;
      if (inStockOnly && !item.available) return false;
      if (!q) return true;
      return (
        item.productTitle.toLowerCase().includes(q) ||
        (item.variantTitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, query, timeFilter, inStockOnly]);

  async function buyAgain(item: BuyAgainItem) {
    if (!item.available) {
      setError("This item is currently unavailable.");
      return;
    }
    setPendingId(item.variantId);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        variantId: item.variantId,
        quantity: Math.max(1, item.lastQuantity),
      }),
    });
    setPendingId(null);
    if (!response.ok) {
      setError("Could not add this item to cart.");
      return;
    }
    setMessage(`Added ${item.productTitle} to cart`);
    router.push("/cart");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] xl:sticky xl:top-6">
        <h2 className="text-base font-semibold">Filters</h2>

        <label className="mt-4 block">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Product name"
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Ordered in
          </p>
          <ul className="mt-3 space-y-2.5">
            {TIME_FILTERS.map((filter) => (
              <li key={filter.key}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="radio"
                    name="buy-again-time"
                    checked={timeFilter === filter.key}
                    onChange={() => setTimeFilter(filter.key)}
                    className="size-4 border-border accent-[var(--accent)]"
                  />
                  <span>{filter.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="size-4 rounded border-border accent-[var(--accent)]"
          />
          <span>In stock only</span>
        </label>

        <div className="mt-6 border-t border-border pt-4 text-xs text-muted">
          <p>{filtered.length} item{filtered.length === 1 ? "" : "s"}</p>
          <Link href="/orders" className="mt-2 inline-block text-accent hover:underline">
            Back to Your Orders
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {error ? (
          <p className="mb-3 rounded-[var(--radius-sm)] bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mb-3 rounded-[var(--radius-sm)] bg-success-soft px-3 py-2 text-sm text-success">
            {message}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface px-5 py-12 text-center shadow-[var(--shadow-card)]">
            <p className="text-base font-semibold">No past purchases to reorder</p>
            <p className="mt-2 text-sm text-muted">
              Once you buy something, it shows up here for one-click reorder.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-[var(--radius-sm)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <li
                key={item.variantId}
                className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-square bg-photo-well">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt ?? item.productTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-accent/30">
                      {item.productTitle.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {!item.available ? (
                    <span className="absolute top-2 left-2 rounded-full bg-danger-soft px-2 py-1 text-[11px] font-bold text-danger">
                      Out of stock
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3.5">
                  {item.productSlug ? (
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="line-clamp-2 text-sm font-semibold text-accent hover:underline"
                    >
                      {item.productTitle}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-sm font-semibold">
                      {item.productTitle}
                    </p>
                  )}
                  {item.variantTitle ? (
                    <p className="text-xs text-muted">{item.variantTitle}</p>
                  ) : null}
                  <p className="text-base font-bold text-brand-accent">
                    {formatPaise(item.unitPricePaise)}
                  </p>
                  <p className="text-[11.5px] text-muted">
                    Bought {item.timesOrdered}× · last{" "}
                    {new Date(item.lastOrderedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    type="button"
                    disabled={pendingId === item.variantId || !item.available}
                    onClick={() => void buyAgain(item)}
                    className="btn-cta mt-auto h-10 bg-highlight px-3 text-sm font-semibold text-foreground disabled:opacity-50"
                  >
                    {pendingId === item.variantId ? "Adding…" : "Buy again"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
