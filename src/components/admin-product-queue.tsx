"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

export type AdminProductTab =
  | "pending"
  | "approved"
  | "rejected"
  | "paused";

type AdminProduct = {
  id: string;
  title: string;
  summary: string;
  description: string;
  status: string;
  version: number;
  statusReason: string | null;
  hsnCode: string | null;
  seller: { id: string; legalName: string; tradeName: string | null };
  category: { id: string; name: string };
  brand: { id: string; name: string } | null;
  images: Array<{ id: string; url: string; altText: string }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    mrpPaise: number;
    sellingPricePaise: number;
    inventory: { onHand: number; reserved: number } | null;
  }>;
};

type Counts = {
  pending: number;
  approved: number;
  rejected: number;
  paused: number;
};

const TABS: Array<{ key: AdminProductTab; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "paused", label: "Paused" },
];

const REJECT_REASONS = [
  "Incomplete product details",
  "Poor quality or missing images",
  "Incorrect category",
  "Pricing or MRP inconsistency",
  "Prohibited or restricted item",
  "Duplicate listing",
  "Brand or authenticity concern",
  "Other",
] as const;

function buildHref(next: {
  tab?: string;
  q?: string;
  page?: number;
  categoryId?: string;
  sellerId?: string;
}) {
  const params = new URLSearchParams();
  const tab = next.tab ?? "pending";
  if (tab !== "pending") params.set("tab", tab);
  if (next.q) params.set("q", next.q);
  if (next.categoryId) params.set("categoryId", next.categoryId);
  if (next.sellerId) params.set("sellerId", next.sellerId);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export function AdminProductQueue({
  tab,
  query,
  page,
  pageSize,
  total,
  pageCount,
  counts,
  categoryId,
  sellerId,
  categories,
  sellers,
  products,
}: {
  tab: AdminProductTab;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  counts: Counts;
  categoryId: string;
  sellerId: string;
  categories: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; legalName: string; tradeName: string | null }>;
  products: AdminProduct[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    product: AdminProduct;
    decision: "approve" | "reject";
  } | null>(null);
  const [rejectCode, setRejectCode] = useState<string>(REJECT_REASONS[0]);
  const [rejectNotes, setRejectNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function hrefFor(overrides: {
    tab?: string;
    q?: string;
    page?: number;
    categoryId?: string;
    sellerId?: string;
  }) {
    return buildHref({
      tab: overrides.tab ?? tab,
      q: overrides.q ?? query,
      page: overrides.page ?? page,
      categoryId:
        overrides.categoryId !== undefined
          ? overrides.categoryId
          : categoryId,
      sellerId:
        overrides.sellerId !== undefined ? overrides.sellerId : sellerId,
    });
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    const nextCategoryId = String(form.get("categoryId") ?? "").trim();
    const nextSellerId = String(form.get("sellerId") ?? "").trim();
    router.push(
      hrefFor({
        q,
        categoryId: nextCategoryId,
        sellerId: nextSellerId,
        page: 1,
      }),
    );
  }

  function openConfirm(
    product: AdminProduct,
    decision: "approve" | "reject",
  ) {
    setError(null);
    setMessage(null);
    setRejectCode(REJECT_REASONS[0]);
    setRejectNotes("");
    setConfirm({ product, decision });
  }

  async function submitReview() {
    if (!confirm) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    let reason: string;
    if (confirm.decision === "approve") {
      reason = "Catalogue attributes accepted";
    } else {
      const notes = rejectNotes.trim();
      if (notes.length < 3 && rejectCode === "Other") {
        setError("Add a short rejection note (at least 3 characters).");
        setBusy(false);
        return;
      }
      reason = notes
        ? `${rejectCode}: ${notes}`.slice(0, 500)
        : rejectCode;
      if (reason.length < 3) {
        setError("Rejection reason is required.");
        setBusy(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/admin/products/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: confirm.product.id,
          decision: confirm.decision,
          reason,
          expectedVersion: confirm.product.version,
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? "Review failed");
        setBusy(false);
        return;
      }
      setMessage(
        confirm.decision === "approve"
          ? "Product approved"
          : "Product rejected — reason shared with seller",
      );
      setConfirm(null);
      setExpandedId(null);
      router.refresh();
    } catch {
      setError("Review request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={hrefFor({ tab: key, page: 1 })}
            className={`rounded-lg border px-3 py-1.5 ${
              tab === key ? "border-accent bg-accent-soft" : "border-border"
            }`}
          >
            {label}
            <span className="ml-1.5 tabular-nums text-muted">
              {counts[key]}
            </span>
          </Link>
        ))}
      </div>

      <form
        onSubmit={onSearch}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-muted">Search</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Title, SKU, or seller"
            className="rounded-lg border border-border px-3 py-2"
          />
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
          <span className="text-muted">Category</span>
          <select
            name="categoryId"
            defaultValue={categoryId}
            className="rounded-lg border border-border px-3 py-2"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
          <span className="text-muted">Seller</span>
          <select
            name="sellerId"
            defaultValue={sellerId}
            className="rounded-lg border border-border px-3 py-2"
          >
            <option value="">All sellers</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.tradeName ?? seller.legalName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          Apply
        </button>
      </form>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error && !confirm ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-muted">
        {total} listing{total === 1 ? "" : "s"} · page {page} of {pageCount}
        {pageSize ? ` · ${pageSize}/page` : ""}
      </p>

      {products.length === 0 ? (
        <p className="text-sm text-muted">No products in this view.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => {
            const variant = product.variants[0];
            const open = expandedId === product.id;
            const primaryImage = product.images[0];
            return (
              <li
                key={product.id}
                className="rounded-card border border-border bg-surface"
              >
                <div className="flex flex-wrap items-start gap-3 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                    {primaryImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={primaryImage.url}
                        alt={primaryImage.altText || product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{product.title}</h2>
                    <p className="text-sm text-muted">
                      {product.seller.tradeName ?? product.seller.legalName} ·{" "}
                      {product.category.name}
                      {product.brand ? ` · ${product.brand.name}` : ""}
                    </p>
                    {variant ? (
                      <p className="mt-1 text-sm">
                        {variant.sku} · {formatPaise(variant.sellingPricePaise)}{" "}
                        · on hand {variant.inventory?.onHand ?? 0}
                      </p>
                    ) : null}
                    {product.statusReason ? (
                      <p className="mt-1 text-sm text-muted">
                        Reason: {product.statusReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                      onClick={() =>
                        setExpandedId(open ? null : product.id)
                      }
                      aria-expanded={open}
                    >
                      {open ? "Hide details" : "Review"}
                    </button>
                    {product.status === "submitted" ? (
                      <>
                        <button
                          type="button"
                          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                          onClick={() => openConfirm(product, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-2 text-sm"
                          onClick={() => openConfirm(product, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {open ? (
                  <div className="border-t border-border px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {product.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative h-28 w-28 overflow-hidden rounded-lg bg-muted/20"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.url}
                            alt={image.altText || product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                      {product.images.length === 0 ? (
                        <p className="text-sm text-muted">No images uploaded.</p>
                      ) : null}
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-muted">Seller</dt>
                        <dd>
                          {product.seller.tradeName ?? product.seller.legalName}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted">Brand</dt>
                        <dd>{product.brand?.name ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">HSN</dt>
                        <dd>{product.hsnCode ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Category</dt>
                        <dd>{product.category.name}</dd>
                      </div>
                      {product.variants.map((v) => (
                        <div key={v.id} className="sm:col-span-2">
                          <dt className="text-muted">
                            Variant {v.sku}
                            {v.title ? ` · ${v.title}` : ""}
                          </dt>
                          <dd>
                            MRP {formatPaise(v.mrpPaise)} · Selling{" "}
                            {formatPaise(v.sellingPricePaise)} · on hand{" "}
                            {v.inventory?.onHand ?? 0} · reserved{" "}
                            {v.inventory?.reserved ?? 0}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-muted">
                        Description
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {product.description || product.summary}
                      </p>
                    </div>
                    {product.status === "submitted" ? (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                          onClick={() => openConfirm(product, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-2 text-sm"
                          onClick={() => openConfirm(product, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-2">
        <Link
          href={hrefFor({ page: Math.max(1, page - 1) })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            page <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor({ page: Math.min(pageCount, page + 1) })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            page >= pageCount ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Next
        </Link>
      </div>

      {confirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-confirm-title"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-lg">
            <h2 id="review-confirm-title" className="text-lg font-semibold">
              {confirm.decision === "approve"
                ? "Approve listing?"
                : "Reject listing?"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirm.product.title}
            </p>
            {confirm.decision === "reject" ? (
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Reason</span>
                  <select
                    value={rejectCode}
                    onChange={(event) => setRejectCode(event.target.value)}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    {REJECT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>
                    Notes
                    {rejectCode === "Other" ? " (required)" : " (optional)"}
                  </span>
                  <textarea
                    value={rejectNotes}
                    onChange={(event) => setRejectNotes(event.target.value)}
                    rows={3}
                    maxLength={450}
                    placeholder="Shown to the seller with the rejection"
                    className="rounded-lg border border-border px-3 py-2"
                  />
                </label>
              </div>
            ) : (
              <p className="mt-3 text-sm">
                This will publish the listing for shoppers.
              </p>
            )}
            {error ? (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm"
                disabled={busy}
                onClick={() => {
                  setConfirm(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  confirm.decision === "approve"
                    ? "bg-accent text-accent-foreground"
                    : "border border-red-700 text-red-800"
                }`}
                disabled={busy}
                onClick={() => void submitReview()}
              >
                {busy
                  ? "Saving…"
                  : confirm.decision === "approve"
                    ? "Confirm approve"
                    : "Confirm reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
