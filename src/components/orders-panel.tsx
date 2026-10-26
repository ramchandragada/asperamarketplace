"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  createdAt: string | Date;
  paidAt?: string | Date | null;
  payments: Array<{ id: string; status: string }>;
  invoices: Array<{ id?: string; invoiceNumber: string; status: string }>;
  lines: Array<{
    id?: string;
    productTitle: string;
    variantTitle?: string;
    quantity: number;
    variantId?: string;
    unitPricePaise?: number;
    lineTotalPaise?: number;
    productSlug?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
  }>;
  address?: {
    fullName: string;
    city: string;
    state: string;
  } | null;
  groups?: Array<{
    id: string;
    status: string;
    shippedAt?: string | Date | null;
    deliveredAt?: string | Date | null;
    trackingUrl?: string | null;
    trackingNumber?: string | null;
    carrier?: string | null;
  }>;
  returnRequests?: Array<{ id: string; status: string }>;
};

type StatusFilter = "on_the_way" | "delivered" | "cancelled" | "returned";
type TimeFilter = "last_30" | "this_year" | "last_year" | "older";

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
];

function yearFilters(): Array<{ key: TimeFilter; label: string }> {
  const year = new Date().getFullYear();
  return [
    { key: "last_30", label: "Last 30 days" },
    { key: "this_year", label: String(year) },
    { key: "last_year", label: String(year - 1) },
    { key: "older", label: "Older" },
  ];
}

function isOnTheWay(order: OrderSummary) {
  if (["cancelled", "fulfilled"].includes(order.status)) return false;
  if (order.returnRequests && order.returnRequests.length > 0) return false;
  return [
    "awaiting_payment",
    "payment_failed",
    "paid",
    "partially_cancelled",
  ].includes(order.status);
}

function isDelivered(order: OrderSummary) {
  return (
    order.status === "fulfilled" ||
    (order.groups?.some((group) => group.status === "delivered") ?? false)
  );
}

function isCancelled(order: OrderSummary) {
  return order.status === "cancelled";
}

function isReturned(order: OrderSummary) {
  return (order.returnRequests?.length ?? 0) > 0;
}

function matchesStatus(order: OrderSummary, selected: Set<StatusFilter>) {
  if (selected.size === 0) return true;
  if (selected.has("on_the_way") && isOnTheWay(order)) return true;
  if (selected.has("delivered") && isDelivered(order)) return true;
  if (selected.has("cancelled") && isCancelled(order)) return true;
  if (selected.has("returned") && isReturned(order)) return true;
  return false;
}

function matchesTime(order: OrderSummary, selected: Set<TimeFilter>) {
  if (selected.size === 0) return true;
  const created = new Date(order.createdAt);
  const now = new Date();
  const year = now.getFullYear();
  const days30 = new Date(now);
  days30.setDate(days30.getDate() - 30);

  if (selected.has("last_30") && created >= days30) return true;
  if (selected.has("this_year") && created.getFullYear() === year) return true;
  if (selected.has("last_year") && created.getFullYear() === year - 1) return true;
  if (selected.has("older") && created.getFullYear() < year - 1) return true;
  return false;
}

function statusHeadline(order: OrderSummary) {
  if (isCancelled(order)) return "Order cancelled";
  if (isReturned(order)) return "Return in progress";
  if (isDelivered(order)) {
    const deliveredAt =
      order.groups?.map((group) => group.deliveredAt).find(Boolean) ?? null;
    return deliveredAt
      ? `Delivered on ${new Date(deliveredAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`
      : "Delivered";
  }
  if (order.status === "awaiting_payment" || order.status === "payment_failed") {
    return "Payment pending";
  }
  const shipped = order.groups?.some(
    (group) => group.status === "shipped" || group.status === "delivered",
  );
  if (shipped) return "On the way";
  if (order.status === "paid" || order.status === "partially_cancelled") {
    return "Preparing for dispatch";
  }
  return order.status.replaceAll("_", " ");
}

function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function OrdersPanel({
  initialOrders,
  allowMockSelfPay = false,
}: {
  initialOrders: OrderSummary[];
  /** Server-gated: never true on live production. */
  allowMockSelfPay?: boolean;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(
    new Set(),
  );
  const [timeFilters, setTimeFilters] = useState<Set<TimeFilter>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const timeOptions = useMemo(() => yearFilters(), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchesStatus(order, statusFilters)) return false;
      if (!matchesTime(order, timeFilters)) return false;
      if (!q) return true;
      const haystack = [
        order.orderNumber,
        order.status,
        order.address?.fullName ?? "",
        ...order.lines.map((line) => line.productTitle),
        ...order.invoices.map((invoice) => invoice.invoiceNumber),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, query, statusFilters, timeFilters]);

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

  async function buyAgainLine(line: OrderSummary["lines"][number]) {
    if (!line.variantId) {
      setError("This item can’t be reordered right now.");
      return;
    }
    setPending(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        variantId: line.variantId,
        quantity: line.quantity,
      }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Could not add item to cart");
      return;
    }
    setMessage("Added to cart");
    router.push("/cart");
  }

  function clearFilters() {
    setStatusFilters(new Set());
    setTimeFilters(new Set());
    setQuery("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] lg:sticky lg:top-36">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Filters</h2>
          {statusFilters.size > 0 || timeFilters.size > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-accent hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Order status
          </p>
          <ul className="mt-3 space-y-2.5">
            {STATUS_FILTERS.map((filter) => (
              <li key={filter.key}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={statusFilters.has(filter.key)}
                    onChange={() =>
                      setStatusFilters((prev) => toggleSet(prev, filter.key))
                    }
                    className="size-4 rounded border-border accent-[var(--accent)]"
                  />
                  <span>{filter.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Order time
          </p>
          <ul className="mt-3 space-y-2.5">
            {timeOptions.map((filter) => (
              <li key={filter.key}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={timeFilters.has(filter.key)}
                    onChange={() =>
                      setTimeFilters((prev) => toggleSet(prev, filter.key))
                    }
                    className="size-4 rounded border-border accent-[var(--accent)]"
                  />
                  <span>{filter.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col gap-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search orders</span>
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            >
              ⌕
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your orders here"
              className="h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface pr-3 pl-9 text-sm shadow-[var(--shadow-card)] outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground"
          >
            Search Orders
          </button>
        </form>

        <p className="text-sm text-muted">
          Viewing{" "}
          <span className="font-semibold text-foreground">
            {visible.length} order{visible.length === 1 ? "" : "s"}
          </span>
          {statusFilters.size || timeFilters.size || query
            ? " matching your filters"
            : " placed recently"}
          .
        </p>

        {message ? <p className="text-sm text-accent">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {visible.length === 0 ? (
          <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-muted">No orders match these filters.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-accent hover:underline"
              >
                Clear filters
              </button>
              <Link href="/shop" className="font-medium text-accent hover:underline">
                Continue shopping
              </Link>
            </div>
          </div>
        ) : null}

        {visible.map((order) => {
          const invoice = order.invoices[0];
          const trackingGroup = order.groups?.find(
            (group) => group.trackingUrl || group.trackingNumber,
          );
          const canPay =
            order.status === "awaiting_payment" ||
            order.status === "payment_failed";
          const canReturn = isDelivered(order);

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]"
            >
              <header className="grid gap-3 border-b border-border bg-accent-soft/50 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">
                      Order placed
                    </p>
                    <p className="mt-0.5 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">
                      Total
                    </p>
                    <p className="mt-0.5 font-medium">
                      {formatPaise(order.totalPaise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wide">
                      Ship to
                    </p>
                    <p className="mt-0.5 font-medium text-accent">
                      {order.address?.fullName ?? "—"}
                    </p>
                    {order.address ? (
                      <p className="text-xs text-muted">
                        {order.address.city}, {order.address.state}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-medium">Order # {order.orderNumber}</p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 sm:justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-accent hover:underline"
                    >
                      View order details
                    </Link>
                    {invoice?.id ? (
                      <a
                        href={`/api/orders/${order.id}/invoices/${invoice.id}`}
                        className="text-accent hover:underline"
                      >
                        Invoice
                      </a>
                    ) : (
                      <span className="text-muted">Invoice pending</span>
                    )}
                  </p>
                </div>
              </header>

              <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {statusHeadline(order)}
                  </p>
                  <ul className="mt-4 flex flex-col gap-4">
                    {order.lines.map((line, index) => (
                      <li
                        key={line.id ?? `${order.id}-${index}`}
                        className="flex gap-3"
                      >
                        <div className="photo-well relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-photo-well">
                          {line.imageUrl ? (
                            <Image
                              src={line.imageUrl}
                              alt={line.imageAlt ?? line.productTitle}
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-accent/40">
                              {line.productTitle.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {line.productSlug ? (
                            <Link
                              href={`/products/${line.productSlug}`}
                              className="font-medium text-accent hover:underline"
                            >
                              {line.productTitle}
                            </Link>
                          ) : (
                            <p className="font-medium">{line.productTitle}</p>
                          )}
                          {line.variantTitle ? (
                            <p className="text-xs text-muted">
                              {line.variantTitle} · Qty {line.quantity}
                            </p>
                          ) : (
                            <p className="text-xs text-muted">
                              Qty {line.quantity}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-semibold text-brand-accent">
                            {formatPaise(
                              line.lineTotalPaise ??
                                (line.unitPricePaise ?? 0) * line.quantity,
                            )}
                          </p>
                          <button
                            type="button"
                            disabled={pending || !line.variantId}
                            onClick={() => void buyAgainLine(line)}
                            className="btn-cta mt-2 h-9 bg-highlight px-3 text-xs text-foreground"
                          >
                            Buy it again
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/orders/${order.id}`}
                    className="btn-cta btn-cta-primary h-10 w-full"
                  >
                    Track package
                  </Link>
                  {trackingGroup?.trackingUrl ? (
                    <a
                      href={trackingGroup.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-cta btn-cta-ghost h-10 w-full"
                    >
                      Carrier tracking
                    </a>
                  ) : null}
                  {canReturn ? (
                    <Link
                      href={`/orders/${order.id}`}
                      className="btn-cta btn-cta-ghost h-10 w-full"
                    >
                      Return or replace
                    </Link>
                  ) : null}
                  <Link
                    href={`/support?orderId=${order.id}`}
                    className="btn-cta btn-cta-ghost h-10 w-full"
                  >
                    Get help
                  </Link>
                  {canPay && allowMockSelfPay ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        className="btn-cta btn-cta-primary h-10 w-full"
                        onClick={() => void startAndSucceed(order.id)}
                      >
                        Pay now (demo)
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        className="btn-cta btn-cta-ghost h-10 w-full text-xs"
                        onClick={() => void startAndFail(order.id)}
                        title="Test tool: simulate a failed payment"
                      >
                        Test failed payment
                      </button>
                    </>
                  ) : null}
                  {canPay && !allowMockSelfPay ? (
                    <p className="rounded-md border border-border bg-background px-3 py-2 text-center text-xs text-muted">
                      Payment gateway coming soon. This order stays unpaid until
                      checkout is connected to Razorpay.
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
