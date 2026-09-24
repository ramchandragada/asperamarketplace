"use client";

import { type FormEvent, useState } from "react";

type Seller = {
  id: string;
  legalName: string;
  status: string;
  version: number;
  documents: Array<{ id: string; documentType: string; fileName: string }>;
};

export function SellerOnboardingPanel({
  initialSellers,
}: {
  initialSellers: Seller[];
}) {
  const [sellers, setSellers] = useState(initialSellers);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await fetch("/api/seller");
    const body = (await response.json()) as {
      data?: { sellers: Seller[] };
    };
    if (response.ok) {
      setSellers(body.data?.sellers ?? []);
    }
  }

  async function createDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      legalName: String(form.get("legalName") ?? ""),
      tradeName: String(form.get("tradeName") ?? "") || undefined,
      contactEmail: String(form.get("contactEmail") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? "") || undefined,
      pan: String(form.get("pan") ?? ""),
      gstin: String(form.get("gstin") ?? "") || undefined,
      registeredState: String(form.get("registeredState") ?? ""),
    };
    const response = await fetch("/api/seller", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string; error?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not create seller draft");
      return;
    }
    setMessage("Seller draft created");
    event.currentTarget.reset();
    await refresh();
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const sellerId = String(form.get("sellerId") ?? "");
    const response = await fetch(`/api/seller/${sellerId}/documents`, {
      method: "POST",
      body: form,
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Upload failed");
      return;
    }
    setMessage("Document uploaded");
    await refresh();
  }

  async function submitSeller(sellerId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch("/api/seller/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sellerId, acceptAgreement: true }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Submit failed");
      return;
    }
    setMessage("Submitted for review");
    await refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={createDraft} className="grid max-w-xl gap-3">
        <h2 className="text-xl font-semibold">Business profile</h2>
        <input name="legalName" required placeholder="Legal name" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="tradeName" placeholder="Trade name" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="contactEmail" type="email" required placeholder="Contact email" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="contactPhone" placeholder="10-digit mobile" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="pan" required placeholder="PAN e.g. ABCDE1234F" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="gstin" placeholder="GSTIN optional" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="registeredState" required placeholder="Registered state" className="rounded-lg border border-border bg-surface px-3 py-2" />
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">
          Save draft
        </button>
      </form>

      {sellers.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Your seller applications</h2>
          {sellers.map((seller) => (
            <article key={seller.id} className="rounded-card border border-border bg-surface p-4">
              <p className="font-medium">{seller.legalName}</p>
              <p className="text-sm text-muted">Status: {seller.status}</p>
              <ul className="mt-2 text-sm">
                {seller.documents.map((doc) => (
                  <li key={doc.id}>
                    {doc.documentType}: {doc.fileName}
                  </li>
                ))}
              </ul>
              {(seller.status === "draft" || seller.status === "rejected") && (
                <>
                  <form onSubmit={uploadDocument} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input type="hidden" name="documentType" value="business_registration" />
                    <input name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required />
                    <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm">
                      Upload KYC document
                    </button>
                  </form>
                  <button
                    type="button"
                    className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                    onClick={() => void submitSeller(seller.id)}
                  >
                    Accept agreement and submit
                  </button>
                </>
              )}
            </article>
          ))}
        </section>
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
