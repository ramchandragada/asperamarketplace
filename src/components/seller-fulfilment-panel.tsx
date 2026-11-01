"use client";

import { type FormEvent, useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type ShipAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type FulfilmentGroup = {
  id: string;
  status: string;
  lineTotalPaise: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    address: ShipAddress | null;
  };
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

const CARRIERS = [
  "Delhivery",
  "Blue Dart",
  "DTDC",
  "India Post / Speed Post",
  "Ekart",
  "Xpressbees",
  "Other",
] as const;

const CANCEL_REASONS = [
  "Out of stock",
  "Buyer requested cancellation",
  "Address unreachable / incomplete",
  "Pricing / listing error",
  "Other",
] as const;

function formatAddress(address: ShipAddress | null | undefined) {
  if (!address) return null;
  const lines = [
    address.fullName,
    address.phone,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.postalCode}`,
    address.country,
  ].filter(Boolean);
  return lines;
}

export function SellerFulfilmentPanel({
  sellerId,
  initialGroups,
  initialReturns,
  returnsOnly = false,
}: {
  sellerId: string;
  initialGroups: FulfilmentGroup[];
  initialReturns: ReturnRow[];
  returnsOnly?: boolean;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [returns, setReturns] = useState(initialReturns);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shipFormId, setShipFormId] = useState<string | null>(null);
  const [cancelFormId, setCancelFormId] = useState<string | null>(null);

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
        return false;
      }
      setMessage(body.message ?? "Updated");
      await refresh();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  async function onShip(event: FormEvent<HTMLFormElement>, groupId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const carrier = String(form.get("carrier") ?? "").trim();
    const otherCarrier = String(form.get("otherCarrier") ?? "").trim();
    const trackingNumber = String(form.get("trackingNumber") ?? "").trim();
    const resolvedCarrier =
      carrier === "Other" ? otherCarrier || "Other" : carrier;
    const ok = await postAction(
      "/api/fulfilment/ship",
      {
        fulfilmentGroupId: groupId,
        carrier: resolvedCarrier,
        trackingNumber,
      },
      groupId,
    );
    if (ok) setShipFormId(null);
  }

  async function onCancel(event: FormEvent<HTMLFormElement>, groupId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") ?? "").trim();
    const detail = String(form.get("detail") ?? "").trim();
    const ok = await postAction(
      "/api/fulfilment/cancel",
      {
        fulfilmentGroupId: groupId,
        reason: detail ? `${reason}: ${detail}` : reason,
      },
      groupId,
    );
    if (ok) setCancelFormId(null);
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
              ? "Seller approved return after review"
              : "Seller rejected return after review",
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

  function printPackSlip(group: FulfilmentGroup) {
    const address = formatAddress(group.order.address) ?? ["Address unavailable"];
    const items = group.lines
      .map(
        (line) =>
          `${line.quantity} × ${line.productTitle} (${line.variantTitle})`,
      )
      .join("\n");
    const html = `<!doctype html><html><head><title>Pack slip ${group.order.orderNumber}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:640px}
      h1{font-size:18px;margin:0 0 8px}p,li{font-size:13px;line-height:1.45}
      .box{border:1px solid #ccc;padding:12px;margin:12px 0;border-radius:8px}</style></head>
      <body>
      <h1>Pack slip · ${group.order.orderNumber}</h1>
      <p>Aspera Marketplace · seller fulfilment</p>
      <div class="box"><strong>Ship to</strong><br>${address.join("<br>")}</div>
      <div class="box"><strong>Items</strong><pre style="white-space:pre-wrap;margin:8px 0 0">${items}</pre></div>
      <p>Merchandise: ${formatPaise(group.lineTotalPaise)}</p>
      <script>window.onload=()=>window.print()</script>
      </body></html>`;
    const win = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
    if (!win) {
      setError("Allow pop-ups to print the pack slip");
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  return (
    <div className="flex flex-col gap-8">
      {message ? <p className="text-sm text-foreground">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {returnsOnly ? null : (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Orders to fulfil</h2>
            <p className="mt-1 text-sm text-muted">
              Pack from the ship-to address, then enter the courier AWB when you
              hand over the parcel.
            </p>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">No paid fulfilment groups yet.</p>
          ) : (
            groups.map((group) => {
              const addressLines = formatAddress(group.order.address);
              return (
                <article
                  key={group.id}
                  className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {group.order.orderNumber}{" "}
                        <span className="font-medium text-muted">
                          · {group.status}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Merchandise (payout base):{" "}
                        {formatPaise(group.lineTotalPaise)} · customer total{" "}
                        {formatPaise(group.order.totalPaise)}
                      </p>
                    </div>
                    {group.trackingNumber ? (
                      <p className="text-sm font-medium">
                        {group.carrier} · {group.trackingNumber}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[var(--radius-sm)] border border-border bg-background p-3">
                      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                        Ship to
                      </p>
                      {addressLines ? (
                        <address className="mt-1 text-sm not-italic leading-6">
                          {addressLines.map((line) => (
                            <div key={line}>{line}</div>
                          ))}
                        </address>
                      ) : (
                        <p className="mt-1 text-sm text-danger">
                          Address missing — contact support before shipping.
                        </p>
                      )}
                    </div>
                    <div className="rounded-[var(--radius-sm)] border border-border bg-background p-3">
                      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                        Items
                      </p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {group.lines.map((line) => (
                          <li key={line.id}>
                            {line.quantity} × {line.productTitle} /{" "}
                            {line.variantTitle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-semibold"
                      onClick={() => printPackSlip(group)}
                    >
                      Print pack slip
                    </button>
                    {group.status === "pending" ? (
                      <button
                        type="button"
                        disabled={busyId === group.id}
                        className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
                        onClick={() =>
                          void postAction(
                            "/api/fulfilment/process",
                            { fulfilmentGroupId: group.id },
                            group.id,
                          )
                        }
                      >
                        Start packing
                      </button>
                    ) : null}
                    {group.status === "processing" ? (
                      <button
                        type="button"
                        disabled={busyId === group.id}
                        className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
                        onClick={() => {
                          setCancelFormId(null);
                          setShipFormId(
                            shipFormId === group.id ? null : group.id,
                          );
                        }}
                      >
                        Enter AWB / ship
                      </button>
                    ) : null}
                    {group.status === "shipped" ? (
                      <button
                        type="button"
                        disabled={busyId === group.id}
                        className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
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
                        className="rounded-[var(--radius-sm)] border border-danger/40 px-3 py-2 text-sm font-semibold text-danger disabled:opacity-50"
                        onClick={() => {
                          setShipFormId(null);
                          setCancelFormId(
                            cancelFormId === group.id ? null : group.id,
                          );
                        }}
                      >
                        Cancel + refund
                      </button>
                    ) : null}
                  </div>

                  {shipFormId === group.id ? (
                    <form
                      className="grid gap-2 rounded-[var(--radius-sm)] border border-border bg-background p-3 md:grid-cols-[1fr_1fr_auto]"
                      onSubmit={(event) => void onShip(event, group.id)}
                    >
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium">Courier</span>
                        <select
                          name="carrier"
                          required
                          defaultValue="Delhivery"
                          className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
                        >
                          {CARRIERS.map((carrier) => (
                            <option key={carrier} value={carrier}>
                              {carrier}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium">AWB / tracking no.</span>
                        <input
                          name="trackingNumber"
                          required
                          minLength={5}
                          placeholder="Paste courier AWB"
                          className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 uppercase"
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={busyId === group.id}
                          className="rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
                        >
                          Confirm ship
                        </button>
                      </div>
                      <label className="grid gap-1 text-sm md:col-span-3 md:max-w-sm">
                        <span className="font-medium">Other courier name</span>
                        <input
                          name="otherCarrier"
                          placeholder="Only if Courier = Other"
                          className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
                        />
                      </label>
                    </form>
                  ) : null}

                  {cancelFormId === group.id ? (
                    <form
                      className="grid gap-2 rounded-[var(--radius-sm)] border border-danger/30 bg-danger-soft/20 p-3"
                      onSubmit={(event) => void onCancel(event, group.id)}
                    >
                      <p className="text-sm font-semibold text-danger">
                        Cancel this fulfilment and refund the buyer?
                      </p>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium">Reason</span>
                        <select
                          name="reason"
                          required
                          className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
                        >
                          {CANCEL_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm">
                        <span className="font-medium">Detail (optional)</span>
                        <input
                          name="detail"
                          maxLength={400}
                          placeholder="Short note for audit"
                          className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={busyId === group.id}
                          className="rounded-[var(--radius-sm)] bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Confirm cancel + refund
                        </button>
                        <button
                          type="button"
                          className="rounded-[var(--radius-sm)] border border-border px-4 py-2 text-sm font-semibold"
                          onClick={() => setCancelFormId(null)}
                        >
                          Keep order
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Return requests</h2>
        {returns.length === 0 ? (
          <p className="text-sm text-muted">No return requests.</p>
        ) : (
          returns.map((row) => (
            <article
              key={row.id}
              className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-surface p-4"
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
                    className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    onClick={() => void reviewReturn(row.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
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
