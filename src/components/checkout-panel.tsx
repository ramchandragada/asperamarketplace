"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";
import type { CheckoutSnapshot } from "@/modules/cart/pricing";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
};

type CartView = {
  id: string;
  version: number;
  merchandisePaise: number;
  items: Array<{ variantId: string; quantity: number }>;
};

export function CheckoutPanel({
  initialCart,
  initialAddresses,
}: {
  initialCart: CartView;
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses[0]?.id ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [cartVersion, setCartVersion] = useState(initialCart.version);
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(null);
  const [reserved, setReserved] = useState<{
    id: string;
    totalPaise: number;
    reservedUntil: string | null;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [idempotencyKey] = useState(
    () => `chk-${crypto.randomUUID()}`,
  );

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
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
      data?: { address: Address };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not save address");
      return;
    }
    if (body.data?.address) {
      setAddresses((prev) => [body.data!.address, ...prev]);
      setAddressId(body.data.address.id);
      event.currentTarget.reset();
      setMessage("Address saved");
    }
  }

  async function preview() {
    if (!addressId) {
      setError("Add a delivery address first");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/checkout/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        addressId,
        couponCode: couponCode.trim() || undefined,
        clientTotalPaise: snapshot?.totalPaise,
      }),
    });
    const body = (await response.json()) as {
      data?: {
        snapshot: CheckoutSnapshot;
        cart: { version: number };
      };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Preview failed");
      return;
    }
    if (body.data) {
      setSnapshot(body.data.snapshot);
      setCartVersion(body.data.cart.version);
      setMessage("Server snapshot refreshed");
    }
  }

  async function confirm() {
    if (!addressId || !snapshot) {
      setError("Preview checkout before confirming");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        addressId,
        couponCode: couponCode.trim() || undefined,
        clientTotalPaise: snapshot.totalPaise,
        expectedCartVersion: cartVersion,
        idempotencyKey,
      }),
    });
    const body = (await response.json()) as {
      data?: {
        checkout: {
          id: string;
          totalPaise: number;
          reservedUntil: string | null;
        };
        snapshot: CheckoutSnapshot;
      };
      message?: string;
    };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Confirm failed");
      return;
    }
    if (body.data) {
      setSnapshot(body.data.snapshot);
      setReserved({
        id: body.data.checkout.id,
        totalPaise: body.data.checkout.totalPaise,
        reservedUntil: body.data.checkout.reservedUntil,
      });
      setMessage(body.message ?? "Reserved");
    }
  }

  async function createOrder() {
    if (!reserved) {
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        checkoutSessionId: reserved.id,
        idempotencyKey: `ord-${crypto.randomUUID()}`,
      }),
    });
    const body = (await response.json()) as {
      data?: { order: { id: string; orderNumber: string } };
      message?: string;
    };
    setPending(false);
    if (!response.ok || !body.data) {
      setError(body.message ?? "Could not create order");
      return;
    }
    setOrderId(body.data.order.id);
    setMessage(`Order ${body.data.order.orderNumber} created`);
  }

  if (initialCart.items.length === 0 && !reserved) {
    return (
      <p className="text-muted">
        Cart is empty.{" "}
        <Link href="/browse" className="underline">
          Browse listings
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {reserved ? (
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Stock reserved</h2>
          <p className="mt-2 text-sm">
            Checkout {reserved.id.slice(0, 8)}… · Total{" "}
            {formatPaise(reserved.totalPaise)}
          </p>
          {reserved.reservedUntil ? (
            <p className="text-sm text-muted">
              Hold until {new Date(reserved.reservedUntil).toLocaleString()}
            </p>
          ) : null}
          {!orderId ? (
            <button
              type="button"
              disabled={pending}
              className="mt-3 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
              onClick={() => void createOrder()}
            >
              Create order
            </button>
          ) : (
            <p className="mt-3 text-sm">
              Order ready.{" "}
              <Link href={`/orders/${orderId}`} className="underline">
                Open order
              </Link>{" "}
              or{" "}
              <Link href="/orders" className="underline">
                pay with mock
              </Link>
              .
            </p>
          )}
          <p className="mt-3 text-sm text-muted">
            Payment uses a signed mock webhook. No live card charges.
          </p>
        </section>
      ) : null}

      {!reserved ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Delivery address</h2>
            {addresses.length > 0 ? (
              <select
                value={addressId}
                onChange={(event) => setAddressId(event.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2"
              >
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label}: {address.fullName}, {address.line1},{" "}
                    {address.city}, {address.state} {address.postalCode}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted">No saved addresses yet.</p>
            )}
            <form
              onSubmit={saveAddress}
              className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2"
            >
              <h3 className="sm:col-span-2 font-medium">Add address</h3>
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
                className="sm:col-span-2 rounded-lg border border-border px-4 py-2 text-sm"
              >
                Save address
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Coupon (optional)</h2>
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="ASPERA10"
              className="rounded-lg border border-border bg-surface px-3 py-2"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => void preview()}
                className="rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
              >
                Preview totals
              </button>
              <button
                type="button"
                disabled={pending || !snapshot}
                onClick={() => void confirm()}
                className="rounded-lg border border-border px-4 py-2 font-medium disabled:opacity-60"
              >
                Confirm & reserve stock
              </button>
            </div>
          </section>
        </>
      ) : null}

      {snapshot ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Server snapshot</h2>
          <ul className="text-sm">
            {snapshot.lines.map((line) => (
              <li key={line.variantId}>
                {line.productTitle} × {line.quantity} ·{" "}
                {formatPaise(line.lineTotalPaise)}
              </li>
            ))}
          </ul>
          <dl className="grid gap-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatPaise(snapshot.subtotalPaise)}</dd>
            </div>
            <div>
              <dt className="text-muted">Discount</dt>
              <dd>{formatPaise(snapshot.discountPaise)}</dd>
            </div>
            <div>
              <dt className="text-muted">Shipping</dt>
              <dd>{formatPaise(snapshot.shippingPaise)}</dd>
            </div>
            <div>
              <dt className="text-muted">Tax (placeholder)</dt>
              <dd>{formatPaise(snapshot.taxPaise)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Total</dt>
              <dd className="text-lg font-semibold">
                {formatPaise(snapshot.totalPaise)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted">{snapshot.tax.explanation}</p>
          <p className="text-xs text-muted">{snapshot.shipping.explanation}</p>
          {snapshot.coupon.code ? (
            <p className="text-xs text-muted">{snapshot.coupon.reason}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
