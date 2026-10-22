"use client";

import { FormEvent, useState } from "react";

type Profile = {
  businessName: string | null;
  gstinMasked: string | null;
  hasGstin: boolean;
  taxInvoicePreferred: boolean;
  preferredPaymentMethod: string;
};

export function AccountBusinessForm({
  initial,
  defaultAddressLabel,
}: {
  initial: Profile | null;
  defaultAddressLabel: string | null;
}) {
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [gstin, setGstin] = useState("");
  const [taxInvoicePreferred, setTaxInvoicePreferred] = useState(
    initial?.taxInvoicePreferred ?? false,
  );
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(
    initial?.preferredPaymentMethod ?? "mock",
  );
  const [gstinMasked, setGstinMasked] = useState(initial?.gstinMasked ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const payload: Record<string, unknown> = {
      businessName,
      taxInvoicePreferred,
      preferredPaymentMethod,
    };
    if (gstin.trim().length > 0) {
      payload.gstin = gstin.trim().toUpperCase();
    }
    const response = await fetch("/api/account/business", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      message?: string;
      data?: { profile: Profile };
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not save settings");
      return;
    }
    if (body.data?.profile) {
      setBusinessName(body.data.profile.businessName ?? "");
      setGstinMasked(body.data.profile.gstinMasked);
      setTaxInvoicePreferred(body.data.profile.taxInvoicePreferred);
      setPreferredPaymentMethod(body.data.profile.preferredPaymentMethod);
      setGstin("");
    }
    setMessage(body.message ?? "Saved");
  }

  return (
    <div className="flex flex-col gap-4">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-5"
      >
        <h2 className="text-lg font-semibold">Business profile</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Trade / business name</span>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            maxLength={200}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            placeholder="Optional"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">GSTIN</span>
          {gstinMasked ? (
            <p className="text-muted">On file: {gstinMasked}</p>
          ) : null}
          <input
            value={gstin}
            onChange={(event) => setGstin(event.target.value.toUpperCase())}
            maxLength={15}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono"
            placeholder={gstinMasked ? "Enter new GSTIN to replace" : "15-character GSTIN"}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={taxInvoicePreferred}
            onChange={(event) => setTaxInvoicePreferred(event.target.checked)}
          />
          Prefer GST tax invoice on paid orders
        </label>

        <h2 className="mt-2 text-lg font-semibold">Default purchase settings</h2>
        <p className="text-sm text-muted">
          Default delivery address:{" "}
          {defaultAddressLabel ?? "None set — manage under Addresses."}
        </p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Preferred payment</span>
          <select
            value={preferredPaymentMethod}
            onChange={(event) => setPreferredPaymentMethod(event.target.value)}
            className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
          >
            <option value="mock">Mock pay (development)</option>
            <option value="online">Online (Razorpay — coming soon)</option>
            <option value="cod">Cash on delivery (coming soon)</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
