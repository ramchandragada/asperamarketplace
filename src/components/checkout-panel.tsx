"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import type { CheckoutSnapshot } from "@/modules/cart/pricing";
import { PincodeField } from "@/components/pincode-field";
import { BuyerProtectionBadge } from "@/components/buyer-protection-badge";

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
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [cartVersion, setCartVersion] = useState(initialCart.version);
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(
    initialReserved?.snapshot ?? null,
  );
  const [reserved] = useState<ReservedView | null>(initialReserved);
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

  // Price the order on the server whenever the address or applied coupon
  // changes, so the shopper always sees a live, authoritative total without a
  // manual "preview" step. All state updates happen after the awaited fetch.
  useEffect(() => {
    if (reserved || !addressId) return;
    let active = true;
    (async () => {
      const response = await fetch("/api/checkout/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          addressId,
          couponCode: appliedCoupon.trim() || undefined,
        }),
      });
      const body = (await response.json()) as {
        data?: { snapshot: CheckoutSnapshot; cart: { version: number } };
        message?: string;
      };
      if (!active) return;
      if (!response.ok) {
        setError(body.message ?? "Could not price this order");
        return;
      }
      if (body.data) {
        setError(null);
        setSnapshot(body.data.snapshot);
        setCartVersion(body.data.cart.version);
      }
    })();
    return () => {
      active = false;
    };
  }, [addressId, appliedCoupon, reserved]);

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

  async function placeOrder() {
    if (!addressId) {
      setError("Add a delivery address first");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      // If stock is already reserved, just create the order from it.
      if (reserved) {
        const order = await placeOrderFromReserved(reserved.id);
        router.push(`/orders/${order.id}`);
        router.refresh();
        return;
      }
      const confirmResponse = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          addressId,
          couponCode: appliedCoupon.trim() || undefined,
          clientTotalPaise: snapshot?.totalPaise,
          expectedCartVersion: cartVersion,
          idempotencyKey,
        }),
      });
      const confirmBody = (await confirmResponse.json()) as {
        data?: {
          checkout: { id: string; totalPaise: number; reservedUntil: string | null };
          snapshot: CheckoutSnapshot;
        };
        message?: string;
      };
      if (!confirmResponse.ok || !confirmBody.data) {
        setError(confirmBody.message ?? "Could not place the order");
        setPending(false);
        return;
      }
      const order = await placeOrderFromReserved(confirmBody.data.checkout.id);
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

  const canPlace = Boolean(addressId) && !pending;

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      <BuyerProtectionBadge compact />

      {!reserved ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Express delivery address</h2>
          <p className="text-xs text-muted">
            ETA is calculated from your pincode — Pune hubs deliver in under 90
            minutes for in-stock parts.
          </p>
          {addresses.length > 0 ? (
            <select
              value={addressId}
              onChange={(event) => setAddressId(event.target.value)}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-base md:min-h-0 md:text-sm"
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label}: {address.fullName}, {address.line1},{" "}
                  {address.city}, {address.state} {address.postalCode}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-muted">
              Add a delivery address to continue.
            </p>
          )}
          <details className="rounded-card border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium">
              {addresses.length > 0 ? "Add a new address" : "Add address"}
            </summary>
            <form onSubmit={saveAddress} className="mt-3 grid gap-3 sm:grid-cols-2">
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
              <label className="text-sm sm:col-span-2">
                Postal code
                <div className="mt-1">
                  <PincodeField
                    autofillCityState
                    className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base md:min-h-0 md:text-sm"
                  />
                </div>
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
          </details>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Order summary</h2>

        {snapshot ? (
          <>
            <ul className="flex flex-col gap-1 text-sm">
              {snapshot.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-3">
                  <span className="text-muted">
                    {line.productTitle} × {line.quantity}
                  </span>
                  <span>{formatPaise(line.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatPaise(snapshot.subtotalPaise)} />
              {snapshot.discountPaise > 0 ? (
                <Row
                  label="Discount"
                  value={`− ${formatPaise(snapshot.discountPaise)}`}
                  accent
                />
              ) : null}
              <Row
                label="Shipping"
                value={
                  snapshot.shippingPaise > 0
                    ? formatPaise(snapshot.shippingPaise)
                    : "FREE"
                }
              />
              <Row label="GST" value={formatPaise(snapshot.taxPaise)} />
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatPaise(snapshot.totalPaise)}</span>
              </div>
            </dl>
            <p className="text-xs text-muted">{snapshot.tax.explanation}</p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Select a delivery address to see your total.
          </p>
        )}

        {!reserved ? (
          <div className="mt-1 flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="coupon">
              Have a coupon?
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="ASPERA10"
                className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base md:min-h-0 md:text-sm"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => setAppliedCoupon(couponCode)}
                className="btn-cta btn-cta-secondary shrink-0 px-4"
              >
                Apply
              </button>
            </div>
            {snapshot?.coupon.code ? (
              <p className="text-xs text-accent">{snapshot.coupon.reason}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!canPlace}
          className="btn-cta btn-cta-primary h-12 w-full text-base"
          onClick={() => void placeOrder()}
        >
          {pending
            ? "Placing order…"
            : snapshot
              ? `Place order · ${formatPaise(snapshot.totalPaise)}`
              : "Place order"}
        </button>
        <p className="text-center text-xs text-muted">
          You’ll choose how to pay on the next step. Your stock is reserved when
          you place the order.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "text-accent" : undefined}>{value}</dd>
    </div>
  );
}
