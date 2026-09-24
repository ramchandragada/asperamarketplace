"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

export type BrowseProduct = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  sellerName: string;
  minPricePaise: number;
  availableQty: number;
};

export function CatalogueBrowse({
  initialItems,
  initialQuery,
  initialTotal,
}: {
  initialItems: BrowseProduct[];
  initialQuery: string;
  initialTotal: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const response = await fetch(`/api/catalogue/products?${params.toString()}`);
    const body = (await response.json()) as {
      data?: { items: BrowseProduct[]; total: number };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Search failed");
      return;
    }
    setItems(body.data?.items ?? []);
    setTotal(body.data?.total ?? 0);
  }

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
            className="w-full rounded-lg border border-border bg-surface px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Searching…" : "Search"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <p className="text-sm text-muted">{total} listing{total === 1 ? "" : "s"}</p>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="border-b border-border pb-4">
            <Link href={`/products/${item.slug}`} className="group block">
              <h2 className="text-xl font-semibold group-hover:underline">
                {item.title}
              </h2>
              <p className="mt-1 text-muted">{item.summary}</p>
              <p className="mt-2 text-sm">
                {formatPaise(item.minPricePaise)} · {item.categoryName} ·{" "}
                {item.sellerName}
                {item.availableQty > 0
                  ? ` · ${item.availableQty} in stock`
                  : " · out of stock"}
              </p>
            </Link>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-muted">No approved products match this search.</li>
        ) : null}
      </ul>
    </div>
  );
}
