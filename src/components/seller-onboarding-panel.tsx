"use client";

import { type FormEvent, useRef, useState } from "react";
import { parseGstin } from "@/modules/seller/gstin";

type Seller = {
  id: string;
  legalName: string;
  status: string;
  version: number;
  documents: Array<{ id: string; documentType: string; fileName: string }>;
};

type GstinProfile = {
  gstin: string;
  pan: string;
  registeredState: string;
  legalName: string | null;
  tradeName: string | null;
  city: string | null;
  source: string;
};

const inputClass =
  "rounded-lg border border-border bg-surface px-3 py-2";

export function SellerOnboardingPanel({
  initialSellers,
}: {
  initialSellers: Seller[];
}) {
  const [sellers, setSellers] = useState(initialSellers);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gstin, setGstin] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [pan, setPan] = useState("");
  const [registeredState, setRegisteredState] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [gstinNote, setGstinNote] = useState<string | null>(null);
  const [gstinPending, setGstinPending] = useState(false);
  const lastLookedUp = useRef("");

  async function refresh() {
    const response = await fetch("/api/seller");
    const body = (await response.json()) as {
      data?: { sellers: Seller[] };
    };
    if (response.ok) {
      setSellers(body.data?.sellers ?? []);
    }
  }

  /** Instant PAN + state from the GSTIN digits (no network). */
  function applyLocalGstinHints(raw: string) {
    const clean = raw.trim().toUpperCase().replace(/\s+/g, "").slice(0, 15);
    setGstin(clean);
    const parsed = parseGstin(clean);
    if (!parsed) {
      if (clean.length < 15) setGstinNote(null);
      return clean;
    }
    setPan(parsed.pan);
    setRegisteredState(parsed.registeredState);
    setGstinNote(
      `PAN and ${parsed.registeredState} filled from GSTIN. Looking up company name…`,
    );
    return clean;
  }

  async function lookupGstin(raw: string) {
    const clean = applyLocalGstinHints(raw);
    const parsed = parseGstin(clean);
    if (!parsed) return;
    if (clean === lastLookedUp.current) return;

    setGstinPending(true);
    try {
      const response = await fetch("/api/seller/gstin-lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gstin: clean }),
      });
      const body = (await response.json()) as {
        data?: { profile: GstinProfile };
        message?: string;
      };
      if (!response.ok || !body.data?.profile) {
        setGstinNote(
          body.message ??
            `PAN and ${parsed.registeredState} filled. Enter legal name as on the GST certificate.`,
        );
        lastLookedUp.current = clean;
        return;
      }
      const profile = body.data.profile;
      lastLookedUp.current = profile.gstin;
      setGstin(profile.gstin);
      setPan(profile.pan);
      setRegisteredState(profile.registeredState);
      if (profile.legalName) {
        setLegalName(profile.legalName);
      }
      if (profile.tradeName) {
        setTradeName(profile.tradeName);
      } else if (profile.legalName) {
        setTradeName(profile.legalName);
      }
      if (profile.city && !pickupCity) {
        setPickupCity(profile.city);
      }
      if (profile.legalName) {
        setGstinNote(
          `Filled ${profile.legalName} · ${profile.registeredState} from GSTIN`,
        );
      } else {
        setGstinNote(
          `PAN and ${profile.registeredState} filled from GSTIN. Enter the legal name as on the GST certificate.`,
        );
      }
    } catch {
      setGstinNote(
        `PAN and ${parsed.registeredState} filled from GSTIN. Enter the legal name as on the GST certificate.`,
      );
      lastLookedUp.current = clean;
    } finally {
      setGstinPending(false);
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
      gstin: String(form.get("gstin") ?? ""),
      registeredState: String(form.get("registeredState") ?? ""),
      pickupCity: String(form.get("pickupCity") ?? ""),
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
    setGstin("");
    setLegalName("");
    setTradeName("");
    setPan("");
    setRegisteredState("");
    setPickupCity("");
    setGstinNote(null);
    lastLookedUp.current = "";
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
        <div className="grid gap-1">
          <input
            name="gstin"
            required
            value={gstin}
            maxLength={15}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Regular GSTIN (15 chars)"
            className={inputClass}
            onChange={(event) => {
              const next = applyLocalGstinHints(event.target.value).slice(0, 15);
              setGstin(next);
              if (next.length === 15) {
                void lookupGstin(next);
              } else {
                lastLookedUp.current = "";
              }
            }}
            onBlur={() => {
              if (gstin.length === 15) void lookupGstin(gstin);
            }}
          />
          {gstinNote ? (
            <p className="text-sm text-muted" aria-live="polite">
              {gstinPending ? "Looking up GSTIN…" : gstinNote}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Enter GSTIN to auto-fill company name, PAN, and state.
            </p>
          )}
        </div>
        <input
          name="legalName"
          required
          value={legalName}
          onChange={(event) => setLegalName(event.target.value)}
          placeholder="Legal name (as on GST)"
          className={inputClass}
        />
        <input
          name="tradeName"
          value={tradeName}
          onChange={(event) => setTradeName(event.target.value)}
          placeholder="Trade name"
          className={inputClass}
        />
        <input
          name="pan"
          required
          value={pan}
          onChange={(event) =>
            setPan(event.target.value.toUpperCase().replace(/\s+/g, ""))
          }
          placeholder="PAN e.g. ABCDE1234F"
          className={inputClass}
        />
        <input
          name="registeredState"
          required
          value={registeredState}
          onChange={(event) => setRegisteredState(event.target.value)}
          placeholder="Registered state (e.g. Maharashtra)"
          className={inputClass}
        />
        <input
          name="pickupCity"
          required
          value={pickupCity}
          onChange={(event) => setPickupCity(event.target.value)}
          placeholder="Pickup city (e.g. Pune)"
          className={inputClass}
        />
        <input
          name="contactEmail"
          type="email"
          required
          placeholder="Contact email"
          className={inputClass}
        />
        <input
          name="contactPhone"
          placeholder="10-digit mobile"
          className={inputClass}
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground"
        >
          Save draft
        </button>
      </form>

      {sellers.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Your seller applications</h2>
          {sellers.map((seller) => (
            <article
              key={seller.id}
              className="rounded-card border border-border bg-surface p-4"
            >
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
                  <form
                    onSubmit={uploadDocument}
                    className="mt-3 flex flex-col gap-2"
                  >
                    <input type="hidden" name="sellerId" value={seller.id} />
                    <input
                      type="hidden"
                      name="documentType"
                      value="business_registration"
                    />
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      required
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-3 py-2 text-sm"
                    >
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

      {message ? <p className="text-sm text-success">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
