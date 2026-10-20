"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

type ReservedView = {
  id: string;
  totalPaise: number;
  reservedUntil: string | null;
  snapshot?: CheckoutSnapshot | null;
};

export function CheckoutPanel({
  initialCart,
  initialAddresses,
  initialReserved = null,
}: {
  initialCart: CartView;
  initialAddresses: Address[];
  initialReserved?: ReservedView | null;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(initialAddresses[0]?.id ?? "");
  const [couponCode, setCouponCode] = useState("");
  const [cartVersion, setCartVersion] = useState(initialCart.version);
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(
    initialReserved?.snapshot ?? null,
  );
  const [reserved, setReserved] = useState<ReservedView | null>(
    initialReserved,
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [idempotencyKey] = useState(() => `chk-${crypto.randomUUID()}`);

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
      setMessage("Totals refreshed from the server");
    }
  }

  async function placeOrderFromReserved(checkoutId: string) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        checkoutSessionId: checkoutId,
        idempotencyKey: `ord-${crypto.randomUUID()}`,
      }),
    });
    const body = (await response.json()) as {
      data?: { order: { id: string; orderNumber: string } };
      message?: string;
    };
    if (!response.ok || !body.data) {
      throw new Error(body.message ?? "Could not place order");
    }
    return body.data.order;
  }

  async function confirmAndPlace() {
    if (!addressId || !snapshot) {
      setError("Preview totals before placing the order");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const confirmResponse = await fetch("/api/checkout/confirm", {
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
      const confirmBody = (await confirmResponse.json()) as {
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
      if (!confirmResponse.ok || !confirmBody.data) {
        setError(confirmBody.message ?? "Could not reserve stock");
        setPending(false);
        return;
      }
      setSnapshot(confirmBody.data.snapshot);
      setReserved({
        id: confirmBody.data.checkout.id,
        totalPaise: confirmBody.data.checkout.totalPaise,
        reservedUntil: confirmBody.data.checkout.reservedUntil,
        snapshot: confirmBody.data.snapshot,
      });
      setMessage("Stock reserved — placing order…");
      const order = await placeOrderFromReserved(confirmBody.data.checkout.id);
      setMessage(`Order ${order.orderNumber} created — continue to payment`);
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
      setPending(false);
    }
  }

  async function placeReservedOrder() {
    if (!reserved) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const order = await placeOrderFromReserved(reserved.id);
      setMessage(`Order ${order.orderNumber} created — continue to payment`);
      router.push(`/orders/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order");
      setPending(false);
    }
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
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {reserved ? (
        <section className="rounded-card border border-accent/40 bg-accent-soft/40 p-4">
          <h2 className="text-lg font-semibold">Ready to place order</h2>
          <p className="mt-2 text-sm">
            Stock is reserved · Total {formatPaise(reserved.totalPaise)}
          </p>
          {reserved.reservedUntil ? (
            <p className="text-sm text-muted">
              Hold until {new Date(reserved.reservedUntil).toLocaleString()}
            </p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-accent px-5 py-2 font-semibold text-white disabled:opacity-60"
            onClick={() => void placeReservedOrder()}
          >
            {pending ? "Placing order…" : "Place order"}
          </button>
          <p className="mt-3 text-sm text-muted">
            Next you&apos;ll pay with the development mock on the order page.
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
              <h3 className="font-medium sm:col-span-2">Add address</h3>
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
                className="rounded-lg border border-border px-4 py-2 text-sm sm:col-span-2"
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
                className="rounded-lg border border-border px-4 py-2 font-medium disabled:opacity-60"
              >
                Preview totals
              </button>
              <button
                type="button"
                disabled={pending || !snapshot}
                onClick={() => void confirmAndPlace()}
                className="min-h-11 rounded-full bg-brand-accent px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Placing…" : "Place order"}
              </button>
            </div>
            <p className="text-xs text-muted">
              Place order reserves stock, creates your order, then takes you to
              mock payment.
            </p>
          </section>
        </>
      ) : null}

      {snapshot ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Order summary</h2>
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
