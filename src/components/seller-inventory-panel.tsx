"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type Row = {
  inventoryItemId: string;
  productId: string;
  productTitle: string;
  productStatus: string;
  sku: string;
  sellingPricePaise: number;
  onHand: number;
  reserved: number;
  available: number;
  variantId: string;
};

export function SellerInventoryPanel({
  sellerId,
  filter,
  initialQuery,
  initialPage,
  initialPageSize,
  initialTotal,
  initialRows,
}: {
  sellerId: string;
  filter: "all" | "low_stock" | "out_of_stock";
  initialQuery: string;
  initialPage: number;
  initialPageSize: number;
  initialTotal: number;
  initialRows: Row[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialRows.map((row) => [row.inventoryItemId, String(row.onHand)])),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(initialTotal / initialPageSize));

  function hrefFor(next: {
    page?: number;
    q?: string;
    filter?: string;
  }) {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    if (nextFilter !== "all") params.set("filter", nextFilter);
    const nextQ = next.q ?? initialQuery;
    if (nextQ) params.set("q", nextQ);
    const nextPage = next.page ?? initialPage;
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/seller/inventory?${qs}` : "/seller/inventory";
  }

  async function saveRow(row: Row) {
    setError(null);
    setMessage(null);
    const onHand = Number(drafts[row.inventoryItemId]);
    if (!Number.isInteger(onHand) || onHand < 0) {
      setError("On-hand must be a whole number ≥ 0");
      return;
    }
    if (onHand < row.reserved) {
      setError(`On-hand cannot be less than reserved (${row.reserved})`);
      return;
    }
    const response = await fetch(`/api/seller/products/${row.productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sellerId,
        variant: { id: row.variantId, onHand },
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not update stock");
      return;
    }
    setRows((current) =>
      current.map((item) =>
        item.inventoryItemId === row.inventoryItemId
          ? {
              ...item,
              onHand,
              available: Math.max(onHand - item.reserved, 0),
            }
          : item,
      ),
    );
    setMessage(`Updated stock for ${row.sku}`);
    router.refresh();
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    router.push(hrefFor({ q, page: 1 }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {(
          [
            ["all", "All"],
            ["low_stock", "Low stock"],
            ["out_of_stock", "Out of stock"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={hrefFor({ filter: key, page: 1 })}
            className={`rounded-lg border px-3 py-1.5 ${
              filter === key ? "border-accent bg-accent-soft" : "border-border"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={initialQuery}
          placeholder="Search title or SKU"
          className="min-w-[16rem] flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          Search
        </button>
      </form>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-muted">
        {initialTotal} SKU{initialTotal === 1 ? "" : "s"} · page {initialPage} of{" "}
        {pageCount}
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">No SKUs in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">On hand</th>
                <th className="px-3 py-2">Reserved</th>
                <th className="px-3 py-2">Available</th>
                <th className="px-3 py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.inventoryItemId} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/seller/catalogue/${row.productId}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {row.productTitle}
                    </Link>
                    <p className="text-xs text-muted">{row.productStatus}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.sku}</td>
                  <td className="px-3 py-2">
                    {formatPaise(row.sellingPricePaise)}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={row.reserved}
                      step={1}
                      value={drafts[row.inventoryItemId] ?? String(row.onHand)}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [row.inventoryItemId]: event.target.value,
                        }))
                      }
                      className="w-24 rounded border border-border px-2 py-1"
                    />
                  </td>
                  <td className="px-3 py-2">{row.reserved}</td>
                  <td className="px-3 py-2 font-semibold">{row.available}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs"
                      onClick={() => void saveRow(row)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={hrefFor({ page: Math.max(1, initialPage - 1) })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            initialPage <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor({ page: Math.min(pageCount, initialPage + 1) })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            initialPage >= pageCount ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
