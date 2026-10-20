"use client";

import { useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type ClaimRow = {
  id: string;
  claimType: string;
  status: string;
  description: string;
  resolutionNote: string | null;
  sellerDebitPaise: number | null;
  createdAt: string;
  decidedAt: string | null;
  orderNumber: string;
  orderStatus: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
};

export function AdminClaimsPanel({
  initialClaims,
}: {
  initialClaims: ClaimRow[];
}) {
  const [claims, setClaims] = useState(initialClaims);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function decide(
    claimId: string,
    decision: "approved" | "rejected" | "under_review" | "seller_resolved",
    resolutionNote: string,
  ) {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/claims/${claimId}/decide`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, resolutionNote }),
    });
    const body = (await response.json()) as {
      data?: { claim: { id: string; status: string; resolutionNote: string | null; sellerDebitPaise: number | null; decidedAt: string | null } };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not update claim");
      return;
    }
    const updated = body.data?.claim;
    if (updated) {
      setClaims((prev) =>
        prev.map((claim) =>
          claim.id === claimId
            ? {
                ...claim,
                status: updated.status,
                resolutionNote: updated.resolutionNote,
                sellerDebitPaise: updated.sellerDebitPaise,
                decidedAt: updated.decidedAt,
              }
            : claim,
        ),
      );
    }
    setMessage(body.message ?? "Claim updated");
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {claims.length === 0 ? (
        <p className="text-sm text-muted">No claims yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {claims.map((claim) => (
            <li
              key={claim.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {claim.orderNumber} · {claim.claimType.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-muted">
                    {claim.buyerName} ({claim.buyerEmail}) · Seller{" "}
                    {claim.sellerName}
                  </p>
                  <p className="mt-1 capitalize">
                    Status: {claim.status.replaceAll("_", " ")}
                    {claim.sellerDebitPaise
                      ? ` · debit ${formatPaise(claim.sellerDebitPaise)}`
                      : ""}
                  </p>
                </div>
                <p className="text-xs text-muted">
                  {new Date(claim.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{claim.description}</p>
              {claim.resolutionNote ? (
                <p className="mt-2 text-muted">Note: {claim.resolutionNote}</p>
              ) : null}
              {["submitted", "under_review"].includes(claim.status) ? (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const decision = String(form.get("decision")) as
                      | "approved"
                      | "rejected"
                      | "under_review"
                      | "seller_resolved";
                    const note = String(form.get("resolutionNote") ?? "");
                    void decide(claim.id, decision, note);
                  }}
                >
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Decision</span>
                    <select
                      name="decision"
                      defaultValue="approved"
                      className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
                    >
                      <option value="under_review">Mark under review</option>
                      <option value="approved">Approve + refund</option>
                      <option value="rejected">Reject</option>
                      <option value="seller_resolved">Seller resolved</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">Resolution note</span>
                    <textarea
                      name="resolutionNote"
                      required
                      minLength={5}
                      rows={2}
                      className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-fit rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                  >
                    Submit decision
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
