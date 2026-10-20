"use client";

import { useState } from "react";
import { formatPaise } from "@/modules/catalogue/helpers";

type Wallet = {
  available: Array<{
    code: string;
    title: string;
    discountBps: number;
    maxDiscountPaise: number;
    status: "available";
    uses: Array<{ orderNumber: string; discountPaise: number; at: string }>;
  }>;
  used: Array<{
    code: string;
    title: string;
    status: "used";
    orderNumber: string;
    discountPaise: number;
    at: string;
  }>;
  expired: Array<{ code: string; title: string; status: "expired" }>;
};

type Tab = "available" | "used" | "expired";

export function AccountCouponsPanel({ wallet }: { wallet: Wallet }) {
  const [tab, setTab] = useState<Tab>("available");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(
          [
            ["available", `Available (${wallet.available.length})`],
            ["used", `Used (${wallet.used.length})`],
            ["expired", `Expired (${wallet.expired.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium ${
              tab === key
                ? "bg-accent text-accent-foreground"
                : "bg-accent-soft/60 hover:bg-accent-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "available" ? (
        wallet.available.length === 0 ? (
          <p className="text-sm text-muted">No coupons available right now.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {wallet.available.map((coupon) => (
              <li
                key={coupon.code}
                className="rounded-[var(--radius)] border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-lg font-semibold">{coupon.code}</p>
                  <span className="text-xs font-medium text-accent">
                    Available
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{coupon.title}</p>
                <p className="mt-1 text-sm">
                  {(coupon.discountBps / 100).toFixed(0)}% off · max{" "}
                  {formatPaise(coupon.maxDiscountPaise)}
                </p>
                {coupon.uses.length > 0 ? (
                  <p className="mt-2 text-xs text-muted">
                    Used {coupon.uses.length} time
                    {coupon.uses.length === 1 ? "" : "s"} previously
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "used" ? (
        wallet.used.length === 0 ? (
          <p className="text-sm text-muted">No redemptions yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {wallet.used.map((entry) => (
              <li
                key={`${entry.code}-${entry.orderNumber}-${entry.at}`}
                className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
              >
                <p className="font-mono font-semibold">{entry.code}</p>
                <p className="mt-1 text-muted">
                  {entry.orderNumber} · saved {formatPaise(entry.discountPaise)} ·{" "}
                  {new Date(entry.at).toLocaleDateString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "expired" ? (
        wallet.expired.length === 0 ? (
          <p className="text-sm text-muted">
            No expired coupons. Time-bound campaigns will appear here later.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {wallet.expired.map((coupon) => (
              <li
                key={coupon.code}
                className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm text-muted"
              >
                <p className="font-mono font-semibold">{coupon.code}</p>
                <p className="mt-1">{coupon.title}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
