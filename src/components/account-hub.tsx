"use client";

import Link from "next/link";
import { useState } from "react";
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
  city: string;
  state: string;
  postalCode: string;
};

export function AccountHub({
  orders,
  addresses,
  profile,
}: {
  orders: OrderRow[];
  addresses: AddressRow[];
  profile: { displayName: string; email: string };
}) {
  const [tab, setTab] = useState<"orders" | "addresses" | "profile">("orders");

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
            onClick={() => setTab(key)}
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
                  <span className="text-sm capitalize text-muted">{order.status}</span>
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
        addresses.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-border bg-surface p-6 text-sm text-muted">
            No saved addresses. Add one during{" "}
            <Link href="/checkout" className="text-accent underline">
              checkout
            </Link>
            .
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
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "profile" ? (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="font-medium">{profile.displayName}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-muted">Add during checkout</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
