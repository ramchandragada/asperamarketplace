"use client";

import { useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type FulfilmentGroup = {
  id: string;
  status: string;
  lineTotalPaise: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  order: { id: string; orderNumber: string; status: string };
  lines: Array<{
    id: string;
    productTitle: string;
    variantTitle: string;
    quantity: number;
    lineTotalPaise: number;
  }>;
  shipment: {
    trackingNumber: string;
    carrier: string;
    status: string;
  } | null;
};

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  quantity: number;
  order: { orderNumber: string };
  refund: { amountPaise: number; status: string } | null;
};

export function SellerFulfilmentPanel({
  sellerId,
  initialGroups,
  initialReturns,
}: {
  sellerId: string;
  initialGroups: FulfilmentGroup[];
  initialReturns: ReturnRow[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [returns, setReturns] = useState(initialReturns);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const [groupsRes, returnsRes] = await Promise.all([
      fetch(`/api/fulfilment/groups?sellerId=${encodeURIComponent(sellerId)}`),
      fetch(`/api/returns?sellerId=${encodeURIComponent(sellerId)}`),
    ]);
    const groupsBody = (await groupsRes.json()) as {
      data?: { groups: FulfilmentGroup[] };
    };
    const returnsBody = (await returnsRes.json()) as {
      data?: { returns: ReturnRow[] };
    };
    if (groupsRes.ok) {
      setGroups(groupsBody.data?.groups ?? []);
    }
    if (returnsRes.ok) {
      setReturns(returnsBody.data?.returns ?? []);
    }
  }

  async function postAction(
    path: string,
    payload: Record<string, unknown>,
    groupId: string,
  ) {
    setBusyId(groupId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? "Action failed");
        return;
      }
      setMessage(body.message ?? "Updated");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function reviewReturn(
    returnRequestId: string,
    decision: "approve" | "reject",
  ) {
    setBusyId(returnRequestId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/returns/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          returnRequestId,
          decision,
          reason:
            decision === "approve"
              ? "Seller approved mock return"
              : "Seller rejected return",
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(body.message ?? "Review failed");
        return;
      }
      setMessage(body.message ?? "Return reviewed");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Fulfilment groups</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted">No paid fulfilment groups yet.</p>
        ) : (
          groups.map((group) => (
            <article
              key={group.id}
              className="flex flex-col gap-3 border-t border-black/10 pt-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {group.order.orderNumber} · {group.status}
                  </p>
                  <p className="text-sm text-muted">
                    Order {group.order.status} ·{" "}
                    {formatPaise(group.lineTotalPaise)}
                  </p>
                </div>
                {group.trackingNumber ? (
                  <p className="text-sm">
                    {group.carrier} · {group.trackingNumber}
                  </p>
                ) : null}
              </div>
              <ul className="text-sm text-muted">
                {group.lines.map((line) => (
                  <li key={line.id}>
                    {line.productTitle} / {line.variantTitle} × {line.quantity}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {group.status === "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === group.id}
                    className="underline disabled:opacity-50"
                    onClick={() =>
                      void postAction(
                        "/api/fulfilment/process",
                        { fulfilmentGroupId: group.id },
                        group.id,
                      )
                    }
                  >
                    Start processing
                  </button>
                ) : null}
                {group.status === "processing" ? (
                  <button
                    type="button"
                    disabled={busyId === group.id}
                    className="underline disabled:opacity-50"
                    onClick={() =>
                      void postAction(
                        "/api/fulfilment/ship",
                        { fulfilmentGroupId: group.id },
                        group.id,
                      )
                    }
                  >
                    Ship (mock)
                  </button>
                ) : null}
                {group.status === "shipped" ? (
                  <button
                    type="button"
                    disabled={busyId === group.id}
                    className="underline disabled:opacity-50"
                    onClick={() =>
                      void postAction(
                        "/api/fulfilment/deliver",
                        { fulfilmentGroupId: group.id },
                        group.id,
                      )
                    }
                  >
                    Mark delivered
                  </button>
                ) : null}
                {group.status !== "delivered" &&
                group.status !== "cancelled" ? (
                  <button
                    type="button"
                    disabled={busyId === group.id}
                    className="underline disabled:opacity-50"
                    onClick={() =>
                      void postAction(
                        "/api/fulfilment/cancel",
                        {
                          fulfilmentGroupId: group.id,
                          reason: "Seller cancelled before delivery",
                        },
                        group.id,
                      )
                    }
                  >
                    Cancel + refund
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Return requests</h2>
        {returns.length === 0 ? (
          <p className="text-sm text-muted">No return requests.</p>
        ) : (
          returns.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-2 border-t border-black/10 pt-4"
            >
              <p className="font-medium">
                {row.order.orderNumber} · {row.status}
              </p>
              <p className="text-sm text-muted">
                Qty {row.quantity} · {row.reason}
              </p>
              {row.refund ? (
                <p className="text-sm">
                  Refund {formatPaise(row.refund.amountPaise)} ·{" "}
                  {row.refund.status}
                </p>
              ) : null}
              {row.status === "requested" ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="underline disabled:opacity-50"
                    onClick={() => void reviewReturn(row.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="underline disabled:opacity-50"
                    onClick={() => void reviewReturn(row.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
