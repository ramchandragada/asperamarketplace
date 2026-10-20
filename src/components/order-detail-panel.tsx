"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string | Date;
  paidAt: string | Date | null;
  cancelledAt: string | Date | null;
  lines: Array<{
    id: string;
    productId: string;
    variantId: string;
    sellerId: string;
    productTitle: string;
    variantTitle: string;
    quantity: number;
    lineTotalPaise: number;
  }>;
  groups: Array<{
    id: string;
    sellerId: string;
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | Date | null;
    deliveredAt: string | Date | null;
    cancelledAt: string | Date | null;
    shipment: { status: string; trackingUrl: string | null } | null;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: string;
    amountPaise: number;
    providerReference: string;
  }>;
  refunds: Array<{
    id: string;
    status: string;
    amountPaise: number;
    reason: string;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalPaise: number;
  }>;
  returnRequests: Array<{
    id: string;
    status: string;
    reason: string;
    quantity: number;
    orderLineId: string | null;
    sellerId: string;
  }>;
  address: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
};

function timelineSteps(order: OrderDetail) {
  const steps: Array<{ label: string; at: string | null; done: boolean }> = [
    {
      label: "Ordered",
      at: String(order.createdAt),
      done: true,
    },
    {
      label: "Paid",
      at: order.paidAt ? String(order.paidAt) : null,
      done: Boolean(order.paidAt) || ["paid", "fulfilled", "partially_cancelled"].includes(order.status),
    },
  ];

  const anyProcessing = order.groups.some(
    (g) =>
      g.status === "processing" ||
      g.status === "shipped" ||
      g.status === "delivered",
  );
  const anyShipped = order.groups.some(
    (g) => g.status === "shipped" || g.status === "delivered",
  );
  const anyDelivered = order.groups.some((g) => g.status === "delivered");
  const shippedAt =
    order.groups.map((g) => g.shippedAt).find(Boolean) ?? null;
  const deliveredAt =
    order.groups.map((g) => g.deliveredAt).find(Boolean) ?? null;

  steps.push({
    label: "Processing",
    at: null,
    done: anyProcessing || anyShipped || anyDelivered,
  });
  steps.push({
    label: "Shipped",
    at: shippedAt ? String(shippedAt) : null,
    done: anyShipped || anyDelivered,
  });
  steps.push({
    label: "Delivered",
    at: deliveredAt ? String(deliveredAt) : null,
    done: anyDelivered || order.status === "fulfilled",
  });

  if (order.status === "cancelled" || order.cancelledAt) {
    steps.push({
      label: "Cancelled",
      at: order.cancelledAt ? String(order.cancelledAt) : null,
      done: true,
    });
  }

  return steps;
}

export function OrderDetailPanel({ order }: { order: OrderDetail }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [returnLineId, setReturnLineId] = useState(
    order.lines.find((line) =>
      order.groups.some(
        (g) => g.sellerId === line.sellerId && g.status === "delivered",
      ),
    )?.id ?? order.lines[0]?.id ?? "",
  );
  const [reviewProductId, setReviewProductId] = useState(
    order.lines[0]?.productId ?? "",
  );

  const canCancel =
    ["awaiting_payment", "payment_failed", "paid", "partially_cancelled"].includes(
      order.status,
    ) &&
    (order.status === "awaiting_payment" ||
      order.status === "payment_failed" ||
      order.groups.some(
        (g) => g.status === "pending" || g.status === "processing",
      ));

  const returnableLines = order.lines.filter((line) =>
    order.groups.some(
      (g) => g.sellerId === line.sellerId && g.status === "delivered",
    ),
  );

  async function cancelOrder() {
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/orders/${order.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Cancelled by customer from order page" }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not cancel order");
      return;
    }
    setMessage(body.message ?? "Order cancelled");
    window.location.reload();
  }

  async function buyAgain() {
    setPending(true);
    setError(null);
    setMessage(null);
    let added = 0;
    for (const line of order.lines) {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variantId: line.variantId,
          quantity: line.quantity,
        }),
      });
      if (response.ok) added += 1;
    }
    setPending(false);
    if (added === 0) {
      setError("Could not add items to cart");
      return;
    }
    window.location.href = "/cart";
  }

  async function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const line = order.lines.find((entry) => entry.id === returnLineId);
    if (!line) {
      setPending(false);
      setError("Choose a line to return");
      return;
    }
    const response = await fetch("/api/returns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        orderLineId: line.id,
        sellerId: line.sellerId,
        quantity: Number(form.get("quantity") ?? 1),
        reason: String(form.get("reason") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not create return");
      return;
    }
    setMessage(body.message ?? "Return requested");
    window.location.reload();
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: reviewProductId,
        orderId: order.id,
        rating: Number(form.get("rating") ?? 5),
        title: String(form.get("title") ?? ""),
        body: String(form.get("body") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not submit review");
      return;
    }
    setMessage(body.message ?? "Review submitted");
    event.currentTarget.reset();
  }

  const steps = timelineSteps(order);

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void buyAgain()}
          className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          Buy again
        </button>
        {canCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void cancelOrder()}
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm disabled:opacity-60"
          >
            Cancel order
          </button>
        ) : null}
        <Link
          href="/account/returns"
          className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
        >
          My returns
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Tracking</h2>
        <ol className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
          {steps.map((step) => (
            <li key={step.label} className="relative text-sm">
              <span
                className={`absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full ${
                  step.done ? "bg-accent" : "bg-border"
                }`}
              />
              <p className={step.done ? "font-medium" : "text-muted"}>
                {step.label}
              </p>
              {step.at ? (
                <p className="text-muted">
                  {new Date(step.at).toLocaleString("en-IN")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {order.groups.map((group) => (
            <li
              key={group.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-3"
            >
              <p className="capitalize">
                {group.status.replaceAll("_", " ")}
                {group.carrier ? ` · ${group.carrier}` : ""}
                {group.trackingNumber ? ` ${group.trackingNumber}` : ""}
              </p>
              {group.trackingUrl || group.shipment?.trackingUrl ? (
                <a
                  href={group.trackingUrl ?? group.shipment?.trackingUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  Open tracking link
                </a>
              ) : null}
            </li>
          ))}
          {order.groups.length === 0 ? (
            <li className="text-muted">No fulfilment groups yet.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Items</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.lines.map((line) => (
            <li key={line.id}>
              {line.productTitle} / {line.variantTitle} × {line.quantity} ·{" "}
              {formatPaise(line.lineTotalPaise)}
            </li>
          ))}
        </ul>
      </section>

      {order.address ? (
        <section>
          <h2 className="text-lg font-semibold">Delivery address</h2>
          <p className="mt-2 text-sm">
            {order.address.fullName}
            <br />
            {order.address.line1}
            <br />
            {order.address.city}, {order.address.state}{" "}
            {order.address.postalCode}
            <br />
            {order.address.phone}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Payments & refunds</h2>
        <ul className="mt-2 text-sm">
          {order.payments.map((payment) => (
            <li key={payment.id}>
              {payment.provider} · {payment.status} ·{" "}
              {formatPaise(payment.amountPaise)}
            </li>
          ))}
          {order.payments.length === 0 ? (
            <li className="text-muted">No payment attempts yet.</li>
          ) : null}
          {order.refunds.map((refund) => (
            <li key={refund.id}>
              Refund {refund.status} · {formatPaise(refund.amountPaise)} ·{" "}
              {refund.reason}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Invoices</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.invoices.map((invoice) => (
            <li key={invoice.id} className="flex flex-wrap items-center gap-3">
              <span>
                {invoice.invoiceNumber} · {invoice.status} ·{" "}
                {formatPaise(invoice.totalPaise)}
              </span>
              <a
                href={`/api/orders/${order.id}/invoices/${invoice.id}`}
                className="text-accent underline"
              >
                Download
              </a>
            </li>
          ))}
          {order.invoices.length === 0 ? (
            <li className="text-muted">
              Issued after a successful payment.
            </li>
          ) : null}
        </ul>
      </section>

      {order.returnRequests.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Return requests</h2>
          <ul className="mt-2 text-sm">
            {order.returnRequests.map((entry) => (
              <li key={entry.id}>
                {entry.status} · qty {entry.quantity} · {entry.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {returnableLines.length > 0 ? (
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Request a return</h2>
          <form onSubmit={submitReturn} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Item</span>
              <select
                value={returnLineId}
                onChange={(event) => setReturnLineId(event.target.value)}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {returnableLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.productTitle} / {line.variantTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Quantity</span>
              <input
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Reason</span>
              <textarea
                name="reason"
                required
                minLength={5}
                rows={3}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Submit return
            </button>
          </form>
        </section>
      ) : null}

      {order.paidAt ? (
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Rate a product</h2>
          <form onSubmit={submitReview} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Product</span>
              <select
                value={reviewProductId}
                onChange={(event) => setReviewProductId(event.target.value)}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {order.lines.map((line) => (
                  <option key={line.id} value={line.productId}>
                    {line.productTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Rating</span>
              <select
                name="rating"
                defaultValue={5}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} star{value === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Title</span>
              <input
                name="title"
                required
                minLength={3}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Review</span>
              <textarea
                name="body"
                required
                minLength={10}
                rows={3}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Submit review
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
