"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type OrderRow = {
  id: string;
  status: string;
  totalPaise: number;
  createdAt: string;
};

type AddressRow = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
};

type Tab = "orders" | "addresses" | "profile";

export function AccountHub({
  orders,
  addresses: initialAddresses,
  profile: initialProfile,
  initialTab = "orders",
}: {
  orders: OrderRow[];
  addresses: AddressRow[];
  profile: { displayName: string; email: string };
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [profile, setProfile] = useState(initialProfile);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
    setMessage(null);
    const url = next === "orders" ? "/account" : `/account?tab=${next}`;
    router.replace(url, { scroll: false });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const body = (await response.json()) as {
      data?: { profile: { displayName: string; email: string } };
      message?: string;
    };
    setPending(false);
    if (!response.ok || !body.data) {
      setError(body.message ?? "Could not update profile");
      return;
    }
    setProfile(body.data.profile);
    setMessage("Profile updated");
    router.refresh();
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
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
      isDefault: true,
    };
    const response = await fetch("/api/checkout/addresses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      data?: { address: AddressRow };
      message?: string;
    };
    setPending(false);
    if (!response.ok || !body.data) {
      setError(body.message ?? "Could not save address");
      return;
    }
    setAddresses((current) => [body.data!.address, ...current]);
    event.currentTarget.reset();
    setMessage("Address saved");
    router.refresh();
  }

  async function removeAddress(addressId: string) {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/checkout/addresses/${addressId}`, {
      method: "DELETE",
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not delete address");
      return;
    }
    setAddresses((current) => current.filter((row) => row.id !== addressId));
    if (editingId === addressId) setEditingId(null);
    setMessage("Address deleted");
    router.refresh();
  }

  async function saveEditedAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) return;
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
      isDefault: form.get("isDefault") === "on",
    };
    const response = await fetch(`/api/checkout/addresses/${editingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as {
      data?: { address: AddressRow };
      message?: string;
    };
    setPending(false);
    if (!response.ok || !body.data) {
      setError(body.message ?? "Could not update address");
      return;
    }
    setAddresses((current) =>
      current.map((row) => (row.id === editingId ? body.data!.address : row)),
    );
    setEditingId(null);
    setMessage("Address updated");
    router.refresh();
  }

  const defaultPhone =
    addresses.find((row) => row.isDefault)?.phone ?? addresses[0]?.phone;
  const editing = addresses.find((row) => row.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(
          [
            ["orders", "My orders"],
            ["addresses", "My addresses"],
            ["profile", "Profile"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium ${
              tab === key
                ? "bg-accent text-accent-foreground"
                : "bg-accent-soft/60 text-foreground hover:bg-accent-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {tab === "orders" ? (
        orders.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-border bg-surface p-6 text-sm text-muted">
            No orders yet.{" "}
            <Link href="/shop" className="text-accent underline">
              Start shopping
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-[var(--radius)] border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    Order {order.id.slice(0, 8)}…
                  </Link>
                  <span className="text-sm capitalize text-muted">
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-sm">
                  {formatPaise(order.totalPaise)} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "addresses" ? (
        <div className="flex flex-col gap-4">
          {addresses.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-border bg-surface p-6 text-sm text-muted">
              No saved addresses yet. Add one below.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
                >
                  <p className="font-semibold">{address.label}</p>
                  <p className="mt-1">{address.fullName}</p>
                  <p className="text-muted">{address.phone}</p>
                  <p className="mt-2 text-muted">
                    {address.line1}, {address.city}, {address.state}{" "}
                    {address.postalCode}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      className="text-sm text-accent underline disabled:opacity-60"
                      onClick={() => setEditingId(address.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="text-sm text-red-700 underline disabled:opacity-60"
                      onClick={() => void removeAddress(address.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {editing ? (
            <form
              key={editing.id}
              onSubmit={saveEditedAddress}
              className="grid gap-3 rounded-[var(--radius)] border border-accent/40 bg-surface p-4 sm:grid-cols-2"
            >
              <h3 className="text-sm font-semibold sm:col-span-2">
                Edit address
              </h3>
              <label className="text-sm">
                Full name
                <input
                  name="fullName"
                  required
                  defaultValue={editing.fullName}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Phone
                <input
                  name="phone"
                  required
                  pattern="[6-9]\d{9}"
                  defaultValue={editing.phone}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Line 1
                <input
                  name="line1"
                  required
                  defaultValue={editing.line1}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Line 2
                <input
                  name="line2"
                  defaultValue={editing.line2 ?? ""}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                City
                <input
                  name="city"
                  required
                  defaultValue={editing.city}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                State
                <input
                  name="state"
                  required
                  defaultValue={editing.state}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Postal code
                <input
                  name="postalCode"
                  required
                  pattern="\d{6}"
                  defaultValue={editing.postalCode}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Label
                <input
                  name="label"
                  defaultValue={editing.label}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={Boolean(editing.isDefault)}
                />
                Default address
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-60"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
          <form
            onSubmit={saveAddress}
            className="grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 sm:grid-cols-2"
          >
            <h3 className="text-sm font-semibold sm:col-span-2">Add address</h3>
            <label className="text-sm">
              Full name
              <input
                name="fullName"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Phone
              <input
                name="phone"
                required
                pattern="[6-9]\d{9}"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Line 1
              <input
                name="line1"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Line 2
              <input
                name="line2"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              City
              <input
                name="city"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              State
              <input
                name="state"
                required
                defaultValue="Karnataka"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Postal code
              <input
                name="postalCode"
                required
                pattern="\d{6}"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Label
              <input
                name="label"
                defaultValue="Home"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60 sm:col-span-2"
            >
              Save address
            </button>
          </form>
        </div>
      ) : null}

      {tab === "profile" ? (
        <form
          onSubmit={saveProfile}
          className="rounded-[var(--radius)] border border-border bg-surface p-6"
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-muted">
                Name
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-medium"
                />
              </label>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium">
                {defaultPhone ?? (
                  <span className="text-muted">
                    Managed on Addresses (no separate account phone field)
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
          >
            Save profile
          </button>
        </form>
      ) : null}
    </div>
  );
}
