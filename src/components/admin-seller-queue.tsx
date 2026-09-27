"use client";

import { useState } from "react";

type AdminSeller = {
  id: string;
  legalName: string;
  status: string;
  version: number;
  statusReason: string | null;
  owner: { email: string; displayName: string };
  documents: Array<{ id: string; documentType: string; fileName: string }>;
};

export function AdminSellerQueue({
  initialSellers,
}: {
  initialSellers: AdminSeller[];
}) {
  const [sellers, setSellers] = useState(initialSellers);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/admin/sellers");
    const body = (await response.json()) as {
      data?: { sellers: AdminSeller[] };
      message?: string;
    };
    if (!response.ok) {
      setError(body.message ?? "Unable to load queue");
      return;
    }
    setSellers(body.data?.sellers ?? []);
  }

  async function review(
    seller: AdminSeller,
    decision: "approve" | "reject",
  ) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/admin/sellers/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sellerId: seller.id,
        decision,
        reason:
          decision === "approve"
            ? "Documents and profile accepted in development review"
            : "Incomplete or inconsistent KYC package",
        expectedVersion: seller.version,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Review failed");
      return;
    }
    setMessage(body.message ?? "Updated");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {sellers.map((seller) => (
        <article key={seller.id} className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">{seller.legalName}</h2>
          <p className="text-sm text-muted">
            {seller.owner.displayName} · {seller.owner.email}
          </p>
          <p className="text-sm">Status: {seller.status}</p>
          {seller.statusReason ? (
            <p className="text-sm text-muted">Reason: {seller.statusReason}</p>
          ) : null}
          <ul className="mt-2 text-sm">
            {seller.documents.map((doc) => (
              <li key={doc.id}>
                {doc.documentType}: {doc.fileName}
              </li>
            ))}
          </ul>
          {(seller.status === "submitted" || seller.status === "under_review") && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                onClick={() => void review(seller, "approve")}
              >
                Approve
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-sm"
                onClick={() => void review(seller, "reject")}
              >
                Reject
              </button>
            </div>
          )}
        </article>
      ))}
      {sellers.length === 0 ? (
        <p className="text-sm text-muted">No seller applications yet.</p>
      ) : null}
      {message ? <p className="text-sm text-green-800">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
