"use client";

import { FormEvent, useState } from "react";

type AddressRow = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

export function AccountAddressesPanel({
  initialAddresses,
}: {
  initialAddresses: AddressRow[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const response = await fetch("/api/checkout/addresses");
    const body = (await response.json()) as {
      data?: { addresses: AddressRow[] };
    };
    if (response.ok && body.data) {
      setAddresses(body.data.addresses);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      label: String(form.get("label") ?? "Home"),
      fullName: String(form.get("fullName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      line1: String(form.get("line1") ?? ""),
      line2: String(form.get("line2") ?? "") || undefined,
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      country: "IN",
      isDefault: form.get("isDefault") === "on",
    };
    const response = await fetch("/api/checkout/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not save address");
      return;
    }
    setMessage(body.message ?? "Address saved");
    event.currentTarget.reset();
    await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {addresses.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm text-muted">
          No saved addresses yet. Add one below.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
            >
              <p className="font-semibold">
                {address.label}
                {address.isDefault ? (
                  <span className="ml-2 text-xs font-medium text-accent">
                    Default
                  </span>
                ) : null}
              </p>
              <p className="mt-1">{address.fullName}</p>
              <p className="text-muted">{address.phone}</p>
              <p className="mt-2 text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">Add address</h2>
        {(
          [
            ["label", "Label", "Home"],
            ["fullName", "Full name", ""],
            ["phone", "Phone (10 digits)", ""],
            ["line1", "Address line 1", ""],
            ["line2", "Address line 2", ""],
            ["city", "City", ""],
            ["state", "State", ""],
            ["postalCode", "PIN code", ""],
          ] as const
        ).map(([name, label, placeholder]) => (
          <label key={name} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={name}
              placeholder={placeholder}
              required={name !== "line2" && name !== "label"}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isDefault" />
          Set as default delivery address
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "Saving…" : "Save address"}
        </button>
      </form>
    </div>
  );
}
