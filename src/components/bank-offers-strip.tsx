"use client";

import Link from "next/link";

const OFFERS = [
  {
    id: "upi",
    title: "UPI Offers",
    detail: "Extra 5% off with UPI",
    href: "/browse?minDiscountPercent=10",
  },
  {
    id: "bank",
    title: "Bank Offers",
    detail: "10% Instant Discount*",
    href: "/browse?minDiscountPercent=20",
  },
  {
    id: "emi",
    title: "No Cost EMI",
    detail: "On select products",
    href: "/browse?minPricePaise=99900",
  },
  {
    id: "cod",
    title: "Cash on Delivery",
    detail: "Pay when you receive",
    href: "/browse",
  },
] as const;

/** Meesho-style bank / payment offers strip */
export function BankOffersStrip() {
  return (
    <section className="border-b border-border bg-[#f7faf9]">
      <div className="container-shell py-3 md:py-4">
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2 className="text-sm font-bold tracking-wide text-foreground uppercase md:text-base">
            Bank & payment offers
          </h2>
          <Link href="/browse" className="text-xs font-semibold text-accent hover:underline">
            View all
          </Link>
        </div>
        <ul className="flex gap-3 overflow-x-auto pb-1">
          {OFFERS.map((offer) => (
            <li key={offer.id} className="shrink-0">
              <Link
                href={offer.href}
                className="flex min-w-[10.5rem] flex-col gap-0.5 rounded-lg border border-border bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-accent/40"
              >
                <span className="text-xs font-bold text-accent">{offer.title}</span>
                <span className="text-[11px] text-muted">{offer.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
