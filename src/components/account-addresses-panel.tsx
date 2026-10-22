"use client";

import { FormEvent, useState } from "react";
import { PincodeField } from "@/components/pincode-field";

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
  const [editingId, setEditingId] = useState<string | null>(null);

  const editing = editingId
    ? (addresses.find((a) => a.id === editingId) ?? null)
    : null;

  async function refresh() {
    const response = await fetch("/api/checkout/addresses");
    const body = (await response.json()) as {
      data?: { addresses: AddressRow[] };
    };
    if (response.ok && body.data) {
      setAddresses(body.data.addresses);
    }
  }

  function payloadFromForm(form: FormData) {
    return {
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
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const formEl = event.currentTarget;
    const payload = payloadFromForm(new FormData(formEl));
    const url = editingId
      ? `/api/checkout/addresses/${editingId}`
      : "/api/checkout/addresses";
    const response = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not save address");
      return;
    }
    setMessage(editingId ? "Address updated" : "Address saved");
    setEditingId(null);
    formEl.reset();
    await refresh();
  }

  async function removeAddress(id: string) {
    if (!window.confirm("Delete this address? This can’t be undone.")) return;
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/checkout/addresses/${id}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not delete address");
      return;
    }
    if (editingId === id) setEditingId(null);
    setMessage("Address deleted");
    await refresh();
  }

  async function makeDefault(address: AddressRow) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/checkout/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? undefined,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: "IN",
        isDefault: true,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Could not set default address");
      return;
    }
    setMessage("Default delivery address updated");
    await refresh();
  }

  const textFields = [
    ["label", "Label", "Home"],
    ["fullName", "Full name", ""],
    ["phone", "Phone (10 digits)", ""],
    ["line1", "Address line 1", ""],
    ["line2", "Address line 2", ""],
    ["city", "City", ""],
    ["state", "State", ""],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {addresses.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm text-muted">
          No saved addresses yet. Add one below.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="flex flex-col rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
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
              <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 text-sm">
                <button
                  type="button"
                  className="min-h-9 font-medium text-accent hover:underline"
                  onClick={() => {
                    setEditingId(address.id);
                    setMessage(null);
                    setError(null);
                  }}
                >
                  Edit
                </button>
                {!address.isDefault ? (
                  <button
                    type="button"
                    className="min-h-9 font-medium text-accent hover:underline"
                    onClick={() => void makeDefault(address)}
                  >
                    Make default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="min-h-9 font-medium text-danger hover:underline"
                  onClick={() => void removeAddress(address.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        key={editingId ?? "new"}
        onSubmit={onSubmit}
        className="grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-5 sm:grid-cols-2"
      >
        <div className="flex items-center justify-between sm:col-span-2">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit address" : "Add address"}
          </h2>
          {editing ? (
            <button
              type="button"
              className="text-sm text-muted hover:underline"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {textFields.map(([name, label, placeholder]) => (
          <label key={name} className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={name}
              placeholder={placeholder}
              defaultValue={editing ? (editing[name] ?? "") : ""}
              required={name !== "line2" && name !== "label"}
              className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">PIN code</span>
          <PincodeField autofillCityState defaultValue={editing?.postalCode ?? ""} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={editing?.isDefault ?? false}
          />
          Set as default delivery address
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2"
        >
          {pending
            ? "Saving…"
            : editing
              ? "Update address"
              : "Save address"}
        </button>
      </form>
    </div>
  );
}
