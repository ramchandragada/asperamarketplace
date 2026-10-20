"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { BuyerProtectionBadge } from "@/components/buyer-protection-badge";

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
    sellerName: string;
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
  protectionClaims: Array<{
    id: string;
    orderLineId: string;
    status: string;
    claimType: string;
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

function groupTimelineSteps(
  order: OrderDetail,
  group: OrderDetail["groups"][number],
) {
  const steps: Array<{ label: string; at: string | null; done: boolean }> = [
    {
      label: "Ordered",
      at: String(order.createdAt),
      done: true,
    },
    {
      label: "Paid",
      at: order.paidAt ? String(order.paidAt) : null,
      done:
        Boolean(order.paidAt) ||
        ["paid", "fulfilled", "partially_cancelled"].includes(order.status),
    },
    {
      label: "Processing",
      at: null,
      done: ["processing", "shipped", "delivered"].includes(group.status),
    },
    {
      label: "Shipped",
      at: group.shippedAt ? String(group.shippedAt) : null,
      done: group.status === "shipped" || group.status === "delivered",
    },
    {
      label: "Delivered",
      at: group.deliveredAt ? String(group.deliveredAt) : null,
      done: group.status === "delivered",
    },
  ];

  if (group.status === "cancelled" || group.cancelledAt) {
    steps.push({
      label: "Cancelled",
      at: group.cancelledAt ? String(group.cancelledAt) : null,
      done: true,
    });
  }

  return steps;
}

export function OrderDetailPanel({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [returnLineId, setReturnLineId] = useState(
    order.lines.find((line) =>
      order.groups.some(
        (g) => g.sellerId === line.sellerId && g.status === "delivered",
      ),
    )?.id ??
      order.lines[0]?.id ??
      "",
  );
  const [reviewProductId, setReviewProductId] = useState(
    order.lines[0]?.productId ?? "",
  );
  const [claimLineId, setClaimLineId] = useState(order.lines[0]?.id ?? "");
  const [sellerFeedbackLineId, setSellerFeedbackLineId] = useState(
    order.lines.find((line) =>
      order.groups.some(
        (g) => g.sellerId === line.sellerId && g.status === "delivered",
      ),
    )?.id ?? "",
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

  const claimableLines = order.lines.filter(
    (line) =>
      !order.protectionClaims.some((claim) => claim.orderLineId === line.id),
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
    router.refresh();
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
    router.push("/cart");
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
    router.refresh();
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

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        orderLineId: claimLineId,
        claimType: String(form.get("claimType") ?? "other"),
        description: String(form.get("description") ?? ""),
      }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not submit claim");
      return;
    }
    setMessage(body.message ?? "Buyer Protection claim submitted");
    router.refresh();
  }

  async function submitSellerFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/trust/seller-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderLineId: sellerFeedbackLineId,
        rating: Number(form.get("rating") ?? 5),
        text: String(form.get("text") ?? "") || undefined,
        shippingRating: Number(form.get("shippingRating") || 0) || undefined,
        packagingRating: Number(form.get("packagingRating") || 0) || undefined,
        accuracyRating: Number(form.get("accuracyRating") || 0) || undefined,
      }),
    });
    const body = (await response.json()) as { message?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.message ?? "Could not submit seller feedback");
      return;
    }
    setMessage(body.message ?? "Seller feedback submitted");
    event.currentTarget.reset();
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <BuyerProtectionBadge />

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

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Shipments</h2>
        {order.groups.map((group) => {
          const steps = groupTimelineSteps(order, group);
          const groupLines = order.lines.filter(
            (line) => line.sellerId === group.sellerId,
          );
          return (
            <article
              key={group.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  {group.sellerName}
                </h3>
                <p className="text-sm capitalize text-muted">
                  {group.status.replaceAll("_", " ")}
                </p>
              </div>
              <ol className="mt-3 flex flex-col gap-3 border-l border-border pl-4">
                {steps.map((step) => (
                  <li key={`${group.id}-${step.label}`} className="relative text-sm">
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
              {(group.carrier || group.trackingNumber) && (
                <p className="mt-3 text-sm">
                  {group.carrier ? `${group.carrier} · ` : ""}
                  {group.trackingNumber ?? ""}
                </p>
              )}
              {group.trackingUrl || group.shipment?.trackingUrl ? (
                <a
                  href={group.trackingUrl ?? group.shipment?.trackingUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-accent underline"
                >
                  Open tracking link
                </a>
              ) : null}
              <ul className="mt-3 space-y-1 text-sm">
                {groupLines.map((line) => (
                  <li key={line.id}>
                    {line.productTitle} / {line.variantTitle} × {line.quantity} ·{" "}
                    {formatPaise(line.lineTotalPaise)}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {order.groups.length === 0 ? (
          <p className="text-sm text-muted">No fulfilment groups yet.</p>
        ) : null}
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

      {order.protectionClaims.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Buyer Protection claims</h2>
          <ul className="mt-2 text-sm">
            {order.protectionClaims.map((claim) => (
              <li key={claim.id}>
                {claim.claimType.replaceAll("_", " ")} ·{" "}
                {claim.status.replaceAll("_", " ")}
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

      {order.paidAt && claimableLines.length > 0 ? (
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">File Buyer Protection claim</h2>
          <p className="mt-1 text-sm text-muted">
            Eligible when delivery SLA is missed, an item is not as described,
            or a return is not honoured.
          </p>
          <form onSubmit={submitClaim} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Item</span>
              <select
                value={claimLineId}
                onChange={(event) => setClaimLineId(event.target.value)}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {claimableLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.productTitle} / {line.variantTitle}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Claim type</span>
              <select
                name="claimType"
                defaultValue="not_as_described"
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                <option value="not_delivered">Not delivered</option>
                <option value="not_as_described">Not as described</option>
                <option value="return_not_honored">Return not honoured</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Describe the issue</span>
              <textarea
                name="description"
                required
                minLength={20}
                rows={4}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Submit claim
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

      {returnableLines.length > 0 ? (
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <h2 className="text-lg font-semibold">Rate the seller</h2>
          <p className="mt-1 text-sm text-muted">
            Separate from product reviews — helps shoppers choose reliable
            sellers.
          </p>
          <form
            onSubmit={submitSellerFeedback}
            className="mt-3 flex flex-col gap-3"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Item / seller</span>
              <select
                value={sellerFeedbackLineId}
                onChange={(event) =>
                  setSellerFeedbackLineId(event.target.value)
                }
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {returnableLines.map((line) => {
                  const group = order.groups.find(
                    (entry) => entry.sellerId === line.sellerId,
                  );
                  return (
                    <option key={line.id} value={line.id}>
                      {group?.sellerName ?? "Seller"} · {line.productTitle}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Overall rating</span>
              <select
                name="rating"
                defaultValue={5}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["shippingRating", "Shipping"],
                  ["packagingRating", "Packaging"],
                  ["accuracyRating", "Accuracy"],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{label}</span>
                  <select
                    name={name}
                    defaultValue={5}
                    className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Comment (optional)</span>
              <textarea
                name="text"
                rows={2}
                maxLength={1000}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
            >
              Submit seller rating
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
