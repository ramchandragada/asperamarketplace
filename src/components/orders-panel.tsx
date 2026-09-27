"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string | Date;
  payments: Array<{ id: string; status: string }>;
  invoices: Array<{ invoiceNumber: string; status: string }>;
  lines: Array<{ productTitle: string; quantity: number }>;
};

export function OrdersPanel({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  return (
    <div className="flex flex-col gap-4">
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {orders.length === 0 ? (
        <p className="text-muted">
          No orders yet.{" "}
          <Link href="/checkout" className="underline">
            Complete checkout
          </Link>
        </p>
      ) : null}
      {orders.map((order) => (
        <article
          key={order.id}
          className="rounded-card border border-border bg-surface p-4"
        >
          <h2 className="font-semibold">{order.orderNumber}</h2>
          <p className="text-sm text-muted">
            {order.status} · {formatPaise(order.totalPaise)} ·{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <ul className="mt-2 text-sm">
            {order.lines.map((line, index) => (
              <li key={`${order.id}-${index}`}>
                {line.productTitle} × {line.quantity}
              </li>
            ))}
          </ul>
          {order.invoices[0] ? (
            <p className="mt-2 text-sm">
              Invoice {order.invoices[0].invoiceNumber} ({order.invoices[0].status})
            </p>
          ) : null}
          {(order.status === "awaiting_payment" ||
            order.status === "payment_failed") && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                onClick={() => void startAndSucceed(order.id)}
              >
                Pay with mock (success)
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-60"
                onClick={() => void startAndFail(order.id)}
              >
                Simulate failure
              </button>
            </div>
          )}
          <p className="mt-2 text-sm">
            <Link href={`/orders/${order.id}`} className="underline">
              View order
            </Link>
          </p>
        </article>
      ))}
    </div>
  );
}
