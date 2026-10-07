"use client";

import { useEffect, useState } from "react";

type PickItem = {
  id: string;
  title: string;
  brandName?: string | null;
  categoryName?: string | null;
  imageUrl?: string | null;
};

export function ProductSourcePicker({
  name = "sourceProductId",
  required = true,
}: {
  name?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PickItem[]>([]);
  const [selected, setSelected] = useState<PickItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            q: trimmed,
            pageSize: "8",
            sort: "relevance",
          });
          const response = await fetch(`/api/catalogue/products?${params}`);
          const body = (await response.json()) as {
            data?: {
              items?: Array<{
                id: string;
                title: string;
                brandName?: string | null;
                categoryName?: string | null;
                brand?: { name?: string } | null;
                category?: { name?: string } | null;
                imageUrl?: string | null;
                primaryImageUrl?: string | null;
              }>;
            };
          };
          const rows = body.data?.items ?? [];
          setItems(
            rows.map((row) => ({
              id: row.id,
              title: row.title,
              brandName: row.brandName ?? row.brand?.name ?? null,
              categoryName: row.categoryName ?? row.category?.name ?? null,
              imageUrl: row.primaryImageUrl ?? row.imageUrl ?? null,
            })),
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const suggestions = query.trim().length < 2 ? [] : items;

  return (
    <div className="sm:col-span-2 flex flex-col gap-2">
      <input type="hidden" name={name} value={selected?.id ?? ""} required={required} />
      <label className="text-sm">
        Search approved products
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title or brand"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </label>
      {selected ? (
        <div className="flex items-center gap-3 rounded-lg border border-accent bg-accent-soft/40 p-2 text-sm">
          {selected.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-border" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{selected.title}</p>
            <p className="truncate text-xs text-muted">
              {[selected.brandName, selected.categoryName].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            className="text-xs underline"
            onClick={() => setSelected(null)}
          >
            Clear
          </button>
        </div>
      ) : null}
      {loading ? <p className="text-xs text-muted">Searching…</p> : null}
      {!selected && suggestions.length > 0 ? (
        <ul className="max-h-56 overflow-auto rounded-lg border border-border">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent-soft/50"
                onClick={() => {
                  setSelected(item);
                  setQuery(item.title);
                  setItems([]);
                }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-border" />
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {[item.brandName, item.categoryName].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
