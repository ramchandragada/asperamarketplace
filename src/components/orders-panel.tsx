"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string | Date;
  payments: Array<{ id: string; status: string }>;
  invoices: Array<{ id?: string; invoiceNumber: string; status: string }>;
  lines: Array<{
    id?: string;
    productTitle: string;
    quantity: number;
    variantId?: string;
  }>;
};

type TabKey =
  | "all"
  | "in-progress"
  | "delivered"
  | "cancelled"
  | "buy-again";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "buy-again", label: "Buy again" },
];

function matchesTab(order: OrderSummary, tab: TabKey) {
  if (tab === "all" || tab === "buy-again") return true;
  if (tab === "in-progress") {
    return [
      "awaiting_payment",
      "payment_failed",
      "paid",
      "partially_cancelled",
    ].includes(order.status);
  }
  if (tab === "delivered") {
    return order.status === "fulfilled";
  }
  if (tab === "cancelled") {
    return order.status === "cancelled";
  }
  return true;
}

export function OrdersPanel({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey | null) ?? "all";
  const [tab, setTab] = useState<TabKey>(
    TABS.some((entry) => entry.key === initialTab) ? initialTab : "all",
  );
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const visible = useMemo(
    () => orders.filter((order) => matchesTab(order, tab)),
    [orders, tab],
  );

  async function refresh() {
    const response = await fetch("/api/orders");
    const body = (await response.json()) as { data?: { orders: OrderSummary[] } };
    if (response.ok && body.data) {
      setOrders(body.data.orders);
    }
  }

  async function startAndSucceed(orderId: string) {
    setPending(true);
    setError(null);
    setMessage(null);
    const start = await fetch("/api/payments/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `pay-${crypto.randomUUID()}`,
      }),
    });
    const startBody = (await start.json()) as {
      data?: { payment: { id: string } };
      message?: string;
    };
    if (!start.ok || !startBody.data) {
      setPending(false);
      setError(startBody.message ?? "Could not start payment");
      return;
    }
    const complete = await fetch("/api/payments/mock-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentAttemptId: startBody.data.payment.id,
        outcome: "succeeded",
      }),
    });
    const completeBody = (await complete.json()) as { message?: string };
    setPending(false);
    if (!complete.ok) {
      setError(completeBody.message ?? "Mock payment failed");
      return;
    }
    setMessage(completeBody.message ?? "Paid");
    await refresh();
  }

  async function startAndFail(orderId: string) {
    setPending(true);
    setError(null);
    setMessage(null);
    const start = await fetch("/api/payments/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderId,
        idempotencyKey: `pay-${crypto.randomUUID()}`,
      }),
    });
    const startBody = (await start.json()) as {
      data?: { payment: { id: string } };
      message?: string;
    };
    if (!start.ok || !startBody.data) {
      setPending(false);
      setError(startBody.message ?? "Could not start payment");
      return;
    }
    const complete = await fetch("/api/payments/mock-complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        paymentAttemptId: startBody.data.payment.id,
        outcome: "failed",
        failureReason: "Mock decline for failure-path testing",
      }),
    });
    const completeBody = (await complete.json()) as { message?: string };
    setPending(false);
    if (!complete.ok) {
      setError(completeBody.message ?? "Could not simulate failure");
      return;
    }
    setMessage(completeBody.message ?? "Failed");
    await refresh();
  }

  async function buyAgain(order: OrderSummary) {
    setPending(true);
    setError(null);
    setMessage(null);
    let added = 0;
    for (const line of order.lines) {
      if (!line.variantId) continue;
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
      setError("Could not add items — open the order for Buy again.");
      return;
    }
    setMessage(`Added ${added} item${added === 1 ? "" : "s"} to cart`);
    window.location.href = "/cart";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium ${
              tab === entry.key
                ? "bg-accent text-accent-foreground"
                : "bg-accent-soft/60 text-foreground hover:bg-accent-soft"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {visible.length === 0 ? (
        <p className="text-muted">
          No orders in this view.{" "}
          <Link href="/shop" className="underline">
            Continue shopping
          </Link>
        </p>
      ) : null}

      {tab === "buy-again"
        ? visible.map((order) => (
            <article
              key={order.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <h2 className="font-semibold">{order.orderNumber}</h2>
              <ul className="mt-2 text-sm">
                {order.lines.map((line, index) => (
                  <li key={`${order.id}-${index}`}>
                    {line.productTitle} × {line.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                  onClick={() => void buyAgain(order)}
                >
                  Buy again
                </button>
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
                >
                  View order
                </Link>
              </div>
            </article>
          ))
        : visible.map((order) => (
            <article
              key={order.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{order.orderNumber}</h2>
                  <p className="text-sm text-muted">
                    {order.status.replaceAll("_", " ")} ·{" "}
                    {formatPaise(order.totalPaise)} ·{" "}
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <Link
                  href={`/orders/${order.id}`}
                  className="text-sm font-medium text-accent underline"
                >
                  Track / manage
                </Link>
              </div>
              <ul className="mt-2 text-sm">
                {order.lines.map((line, index) => (
                  <li key={`${order.id}-${index}`}>
                    {line.productTitle} × {line.quantity}
                  </li>
                ))}
              </ul>
              {order.invoices[0] ? (
                <p className="mt-2 text-sm text-muted">
                  Invoice {order.invoices[0].invoiceNumber}
                </p>
              ) : null}
              {(order.status === "awaiting_payment" ||
                order.status === "payment_failed") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                    onClick={() => void startAndSucceed(order.id)}
                  >
                    Pay with mock (success)
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm disabled:opacity-60"
                    onClick={() => void startAndFail(order.id)}
                  >
                    Simulate failure
                  </button>
                </div>
              )}
            </article>
          ))}
    </div>
  );
}
