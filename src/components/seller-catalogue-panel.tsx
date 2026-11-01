"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  discountPercent,
  formatPaise,
  paiseFromRupees,
  rupeesFromPaise,
  suggestSellerOfferSku,
} from "@/modules/catalogue/helpers";
import {
  ProductSourcePicker,
  type CataloguePickSelection,
} from "@/components/product-source-picker";
import { apiErrorMessage } from "@/platform/http/api-error-message";

type SellerProduct = {
  id: string;
  title: string;
  status: string;
  version: number;
  slug: string;
  statusReason?: string | null;
  category: { name: string };
  images?: Array<{ url: string }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    mrpPaise: number;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

export function SellerCataloguePanel({
  sellerId,
  sellerName,
  initialProducts,
  initialTotal,
  initialPage,
  initialPageSize,
  initialQuery,
  initialStatus,
}: {
  sellerId: string;
  sellerName: string;
  /** @deprecated Closed catalogue — categories kept optional for call-site compat */
  categories?: Array<{ id: string; slug: string; name: string }>;
  initialProducts: SellerProduct[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialQuery: string;
  initialStatus: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceProductId, setSourceProductId] = useState("");
  const [offerSku, setOfferSku] = useState("");
  const [offerVariantTitle, setOfferVariantTitle] = useState("Standard");
  const [offerMrpRupees, setOfferMrpRupees] = useState("");
  const [offerSellingRupees, setOfferSellingRupees] = useState("");
  const [offerStock, setOfferStock] = useState("10");
  const [pickerKey, setPickerKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const pageSize = initialPageSize;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function applyCataloguePick(selection: CataloguePickSelection | null) {
    if (!selection) {
      setSourceProductId("");
      return;
    }
    // Never reuse the catalogue shell SKU — variant.sku is globally unique.
    setSourceProductId(selection.sourceProductId);
    setOfferSku(suggestSellerOfferSku(sellerName, selection.catalogueSku));
    setOfferVariantTitle(selection.variantTitle || "Standard");
    const mrp = Number(selection.mrpPaise);
    const selling = Number(selection.sellingPricePaise);
    setOfferMrpRupees(
      Number.isFinite(mrp) && mrp > 0 ? rupeesFromPaise(mrp) : "",
    );
    setOfferSellingRupees(
      Number.isFinite(selling) && selling > 0 ? rupeesFromPaise(selling) : "",
    );
    setOfferStock((prev) => (prev.trim() ? prev : "10"));
  }

  const canList =
    Boolean(sourceProductId) &&
    Boolean(offerSku.trim()) &&
    Number(offerMrpRupees) > 0 &&
    Number(offerSellingRupees) > 0 &&
    Number(offerStock) >= 0 &&
    !busy;

  const listBlockReason = !sourceProductId
    ? "Select Category → Sub category → Brand → Product → SKU first"
    : !offerSku.trim()
      ? "Enter your shop SKU"
      : !(Number(offerMrpRupees) > 0) || !(Number(offerSellingRupees) > 0)
        ? "Enter MRP and selling price"
        : null;

  const statusOptions = useMemo(
    () => ["", "draft", "submitted", "approved", "rejected", "archived"],
    [],
  );

  async function refresh(next?: {
    page?: number;
    q?: string;
    status?: string;
  }) {
    const nextPage = next?.page ?? page;
    const nextQ = next?.q ?? query;
    const nextStatus = next?.status ?? status;
    const params = new URLSearchParams({
      sellerId,
      page: String(nextPage),
      pageSize: String(pageSize),
    });
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    const response = await fetch(`/api/seller/products?${params}`);
    const body = (await response.json()) as {
      data?: {
        products?: SellerProduct[];
        items?: SellerProduct[];
        total?: number;
        page?: number;
      };
      message?: string;
      fieldErrors?: Record<string, string[]> | null;
    };
    if (!response.ok) {
      setError(apiErrorMessage(body, "Could not load products"));
      return;
    }
    setProducts(body.data?.products ?? body.data?.items ?? []);
    setTotal(body.data?.total ?? 0);
    setPage(body.data?.page ?? nextPage);
    setQuery(nextQ);
    setStatus(nextStatus);
  }

  async function createOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!sourceProductId) {
      setError("Select a catalogue product (Category → … → SKU) first");
      return;
    }
    const mrpRupees = Number(offerMrpRupees);
    const sellingRupees = Number(offerSellingRupees);
    if (!(mrpRupees > 0) || !(sellingRupees > 0)) {
      setError("Enter MRP and selling price in rupees");
      return;
    }
    if (sellingRupees > mrpRupees) {
      setError("Selling price cannot be greater than MRP");
      return;
    }
    const sku = offerSku.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,64}$/.test(sku)) {
      setError("Your SKU must be 3–64 characters: A–Z, 0–9, or hyphen");
      return;
    }
    const payload = {
      sellerId,
      sourceProductId,
      variant: {
        sku,
        title: offerVariantTitle.trim() || undefined,
        mrpPaise: paiseFromRupees(mrpRupees),
        sellingPricePaise: paiseFromRupees(sellingRupees),
        initialStock: Math.max(0, Number(offerStock) || 0),
      },
    };
    setBusy(true);
    try {
      const response = await fetch("/api/seller/products/offer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string[]> | null;
      };
      if (!response.ok) {
        setError(apiErrorMessage(body, "Could not create offer"));
        return;
      }
      setMessage(
        body.message ??
          "Listing live — manage price and stock from your catalogue",
      );
      setSourceProductId("");
      setOfferSku("");
      setOfferVariantTitle("Standard");
      setOfferMrpRupees("");
      setOfferSellingRupees("");
      setOfferStock("10");
      setPickerKey((value) => value + 1);
      await refresh({ page: 1 });
    } catch {
      setError("Network error — could not list product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <form
        noValidate
        onSubmit={createOffer}
        className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          List from catalogue
        </h2>
        <p className="sm:col-span-2 text-sm text-muted">
          Select Category → Sub category → Brand → Product → SKU. You only set
          your price and stock — product identity stays with Aspera.
        </p>
        <ProductSourcePicker
          key={pickerKey}
          name="sourceProductId"
          onSelect={applyCataloguePick}
        />
        <label className="text-sm">
          Your SKU
          <input
            name="offerSku"
            value={offerSku}
            onChange={(event) => setOfferSku(event.target.value.toUpperCase())}
            placeholder="Shop-unique SKU"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 uppercase"
          />
          <span className="mt-1 block text-xs text-muted">
            Must be unique to your shop — do not reuse the catalogue SKU.
          </span>
        </label>
        <label className="text-sm">
          Variant title
          <input
            name="offerVariantTitle"
            value={offerVariantTitle}
            onChange={(event) => setOfferVariantTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          MRP (₹)
          <input
            name="offerMrpRupees"
            type="number"
            min={0.01}
            step="0.01"
            value={offerMrpRupees}
            onChange={(event) => setOfferMrpRupees(event.target.value)}
            placeholder="e.g. 499"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Selling price (₹)
          <input
            name="offerSellingRupees"
            type="number"
            min={0.01}
            step="0.01"
            value={offerSellingRupees}
            onChange={(event) => setOfferSellingRupees(event.target.value)}
            placeholder="e.g. 399"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Initial stock
          <input
            name="offerInitialStock"
            type="number"
            min={0}
            step={1}
            value={offerStock}
            onChange={(event) => setOfferStock(event.target.value)}
            placeholder="e.g. 20"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        {listBlockReason ? (
          <p className="sm:col-span-2 text-sm text-muted">{listBlockReason}</p>
        ) : null}
        <button
          type="submit"
          disabled={!canList}
          className="sm:col-span-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Listing…" : "List product"}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void refresh({
                page: 1,
                q: String(form.get("q") ?? ""),
                status: String(form.get("status") ?? ""),
              });
            }}
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="Search title or SKU"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {statusOptions.map((value) => (
                <option key={value || "all"} value={value}>
                  {value || "All statuses"}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Filter
            </button>
          </form>
        </div>
        <p className="text-sm text-muted">
          {total} listing{total === 1 ? "" : "s"} · page {page} of {pageCount}
        </p>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-border text-left text-xs font-medium tracking-wide text-muted uppercase">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="md:divide-y md:divide-border">
                {products.map((product) => {
                  const variant = product.variants[0];
                  const available = Math.max(
                    (variant?.inventory?.onHand ?? 0) -
                      (variant?.inventory?.reserved ?? 0),
                    0,
                  );
                  const off =
                    variant != null
                      ? discountPercent(
                          variant.mrpPaise,
                          variant.sellingPricePaise,
                        )
                      : null;
                  const statusClass =
                    product.status === "approved"
                      ? "text-success"
                      : product.status === "submitted"
                        ? "text-warning"
                        : product.status === "rejected"
                          ? "text-danger"
                          : "text-muted";
                  return (
                    <tr
                      key={product.id}
                      className="mb-3 block rounded-card border border-border bg-surface p-4 align-top md:mb-0 md:table-row md:border-0 md:bg-transparent md:p-0"
                    >
                      <td className="block md:table-cell md:py-3 md:pr-3">
                        <Link
                          href={`/seller/catalogue/${product.id}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          {product.title}
                        </Link>
                        <span className="block text-xs text-muted">
                          {product.category.name}
                        </span>
                      </td>
                      <td className="block py-0.5 text-muted md:table-cell md:py-3 md:pr-3">
                        <span className="font-medium text-foreground md:hidden">
                          SKU:{" "}
                        </span>
                        {variant?.sku ?? "—"}
                      </td>
                      <td className="block py-0.5 md:table-cell md:py-3 md:pr-3">
                        {variant ? (
                          <>
                            {formatPaise(variant.sellingPricePaise)}
                            {variant.mrpPaise > variant.sellingPricePaise ? (
                              <span className="ml-2 text-muted line-through">
                                {formatPaise(variant.mrpPaise)}
                              </span>
                            ) : null}
                            {off ? (
                              <span className="ml-2 text-accent">{off}% off</span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="block py-0.5 md:table-cell md:py-3 md:pr-3">
                        <span className="font-medium text-foreground md:hidden">
                          Stock:{" "}
                        </span>
                        {available}
                        <span className="text-muted"> available</span>
                      </td>
                      <td className="block py-0.5 md:table-cell md:py-3 md:pr-3">
                        <span className={`font-medium capitalize ${statusClass}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="mt-3 flex flex-wrap gap-2 md:mt-0 md:table-cell md:py-3 md:text-right">
                        <Link
                          href={`/seller/catalogue/${product.id}`}
                          className="rounded-lg border border-border px-3 py-1.5 text-sm"
                        >
                          Price &amp; stock
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
        {products.length === 0 ? (
          <p className="text-sm text-muted">No products match this filter.</p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void refresh({ page: page - 1 })}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pageCount}
            className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-40"
            onClick={() => void refresh({ page: page + 1 })}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
