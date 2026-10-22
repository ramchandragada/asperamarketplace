"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type AdminSellerTab = "pending" | "approved" | "suspended" | "all";

type ReviewDecision =
  | "approve"
  | "reject"
  | "request_info"
  | "suspend"
  | "reactivate";

type AdminSeller = {
  id: string;
  legalName: string;
  tradeName: string | null;
  status: string;
  version: number;
  statusReason: string | null;
  contactEmail: string;
  contactPhone: string | null;
  panLast4: string | null;
  gstinMasked: string | null;
  registeredState: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  owner: { email: string; displayName: string };
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    contentType?: string;
    storageKey?: string;
  }>;
};

type Counts = {
  pending: number;
  approved: number;
  suspended: number;
  all: number;
};

const TABS: Array<{ key: AdminSellerTab; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "suspended", label: "Suspended" },
  { key: "all", label: "All" },
];

const DECISION_COPY: Record<
  ReviewDecision,
  { title: string; confirm: string; reasonRequired: boolean }
> = {
  approve: {
    title: "Approve seller?",
    confirm: "Confirm approve",
    reasonRequired: false,
  },
  reject: {
    title: "Reject seller?",
    confirm: "Confirm reject",
    reasonRequired: true,
  },
  request_info: {
    title: "Request more information?",
    confirm: "Send request",
    reasonRequired: true,
  },
  suspend: {
    title: "Suspend seller?",
    confirm: "Confirm suspend",
    reasonRequired: true,
  },
  reactivate: {
    title: "Reactivate seller?",
    confirm: "Confirm reactivate",
    reasonRequired: false,
  },
};

function isPending(status: string) {
  return status === "submitted" || status === "under_review";
}

function buildHref(tab: AdminSellerTab, search?: string) {
  const params = new URLSearchParams();
  if (tab !== "pending") params.set("tab", tab);
  if (search && search.trim()) params.set("q", search.trim());
  const qs = params.toString();
  return qs ? `/admin/sellers?${qs}` : "/admin/sellers";
}

function formatPan(panLast4: string | null) {
  if (!panLast4) return "—";
  return `****${panLast4}`;
}

export function AdminSellerQueue({
  initialSellers,
  tab,
  counts,
  hasMore,
  search,
}: {
  initialSellers: AdminSeller[];
  tab: AdminSellerTab;
  counts: Counts;
  hasMore: boolean;
  search: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<{
    seller: AdminSeller;
    decision: ReviewDecision;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sortByRating, setSortByRating] = useState(true);

  // The server already filters by tab + search; just sort the current page.
  const visible = useMemo(() => {
    if (!sortByRating) return initialSellers;
    return [...initialSellers].sort(
      (a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0),
    );
  }, [initialSellers, sortByRating]);

  function openConfirm(seller: AdminSeller, decision: ReviewDecision) {
    setError(null);
    setMessage(null);
    setReason(
      decision === "approve"
        ? "Documents and profile accepted"
        : decision === "reactivate"
          ? "Seller reinstated for manual review"
          : "",
    );
    setConfirm({ seller, decision });
  }

  async function refresh() {
    // The server component re-queries the current tab/search on refresh, and
    // the page key (seller versions) remounts this list with fresh data.
    router.refresh();
  }

  async function submitReview() {
    if (!confirm) return;
    const trimmed = reason.trim();
    const needsReason = DECISION_COPY[confirm.decision].reasonRequired;
    if (trimmed.length < 3) {
      setError(
        needsReason
          ? "A reason of at least 3 characters is required."
          : "Add a short note (at least 3 characters).",
      );
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/sellers/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sellerId: confirm.seller.id,
          decision: confirm.decision,
          reason: trimmed.slice(0, 500),
          expectedVersion: confirm.seller.version,
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? "Review failed");
        setBusy(false);
        return;
      }
      setMessage(body.message ?? "Updated");
      setConfirm(null);
      await refresh();
    } catch {
      setError("Review request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        method="get"
        action="/admin/sellers"
        className="flex flex-wrap items-center gap-2"
      >
        {tab !== "pending" ? (
          <input type="hidden" name="tab" value={tab} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search name, email, or GSTIN"
          aria-label="Search sellers"
          className="min-h-10 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Search
        </button>
        {search ? (
          <Link href={buildHref(tab)} className="text-sm text-muted hover:underline">
            Clear
          </Link>
        ) : null}
      </form>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={buildHref(key, search)}
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
        <label className="ml-auto flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={sortByRating}
            onChange={(event) => setSortByRating(event.target.checked)}
          />
          Sort by rating
        </label>
      </div>

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error && !confirm ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <p className="text-sm text-muted">
          Showing the first {visible.length}. Refine with search to narrow the
          list.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-sm text-muted">
          {search
            ? "No sellers match your search in this view."
            : "No sellers in this view."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((seller) => (
            <li
              key={seller.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">
                    {seller.tradeName ?? seller.legalName}
                  </h2>
                  {seller.tradeName ? (
                    <p className="text-sm text-muted">{seller.legalName}</p>
                  ) : null}
                  <p className="text-sm text-muted">
                    {seller.owner.displayName} · {seller.owner.email}
                  </p>
                  <p className="mt-1 text-sm">
                    Status: <span className="font-medium">{seller.status}</span>
                    {(seller.ratingCount ?? 0) > 0
                      ? ` · ${(seller.ratingAvg ?? 0).toFixed(1)}★ (${seller.ratingCount})`
                      : " · No ratings"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isPending(seller.status) ? (
                    <>
                      <button
                        type="button"
                        className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                        onClick={() => openConfirm(seller, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                        onClick={() => openConfirm(seller, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-2 text-sm"
                        onClick={() => openConfirm(seller, "request_info")}
                      >
                        Request info
                      </button>
                    </>
                  ) : null}
                  {seller.status === "approved" ? (
                    <button
                      type="button"
                      className="rounded-lg border border-danger px-3 py-2 text-sm text-danger"
                      onClick={() => openConfirm(seller, "suspend")}
                    >
                      Suspend
                    </button>
                  ) : null}
                  {seller.status === "suspended" ? (
                    <button
                      type="button"
                      className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                      onClick={() => openConfirm(seller, "reactivate")}
                    >
                      Reactivate
                    </button>
                  ) : null}
                </div>
              </div>

              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">PAN</dt>
                  <dd>{formatPan(seller.panLast4)}</dd>
                </div>
                <div>
                  <dt className="text-muted">GSTIN</dt>
                  <dd>{seller.gstinMasked ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">State</dt>
                  <dd>{seller.registeredState ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Contact</dt>
                  <dd>
                    {seller.contactEmail}
                    {seller.contactPhone ? ` · ${seller.contactPhone}` : ""}
                  </dd>
                </div>
              </dl>

              {seller.statusReason ? (
                <p className="mt-3 text-sm text-muted">
                  Reason: {seller.statusReason}
                </p>
              ) : null}

              <div className="mt-3">
                <p className="text-sm font-medium">Documents</p>
                {seller.documents.length === 0 ? (
                  <p className="text-sm text-muted">No documents uploaded.</p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {seller.documents.map((doc) => (
                      <li key={doc.id}>
                        <AdminDocumentLink
                          href={`/api/admin/sellers/${seller.id}/documents/${doc.id}`}
                          label={`${doc.documentType}: ${doc.fileName}`}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirm ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-review-title"
        >
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-lg">
            <h2 id="seller-review-title" className="text-lg font-semibold">
              {DECISION_COPY[confirm.decision].title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirm.seller.tradeName ?? confirm.seller.legalName}
            </p>
            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span>
                Reason
                {DECISION_COPY[confirm.decision].reasonRequired
                  ? " (required)"
                  : ""}
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="rounded-lg border border-border px-3 py-2"
                placeholder="Operator note (min 3 characters)"
              />
            </label>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
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
                  confirm.decision === "reject" ||
                  confirm.decision === "suspend"
                    ? "border border-danger text-danger"
                    : "bg-accent text-accent-foreground"
                }`}
                disabled={busy}
                onClick={() => void submitReview()}
              >
                {busy ? "Saving…" : DECISION_COPY[confirm.decision].confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminDocumentLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  const [checking, setChecking] = useState(false);

  if (unavailable) {
    return <span className="text-muted">file unavailable</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-accent underline-offset-2 hover:underline"
      onClick={(event) => {
        event.preventDefault();
        if (checking) return;
        setChecking(true);
        void (async () => {
          try {
            const response = await fetch(href);
            if (response.status === 404) {
              setUnavailable(true);
              return;
            }
            if (!response.ok) {
              setUnavailable(true);
              return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            setUnavailable(true);
          } finally {
            setChecking(false);
          }
        })();
      }}
    >
      {checking ? `${label}…` : label}
    </a>
  );
}
