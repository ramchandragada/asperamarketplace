import Link from "next/link";
import type { Metadata } from "next";
import {
  ASPERA_PRICE_PROMISE,
  ASPERA_PROMO,
  ASPERA_TRUST_STRIP,
} from "@/lib/aspera-promises";
import { siteContact } from "@/platform/config/site-contact";

export const metadata: Metadata = {
  title: "Why Aspera",
  description:
    "Express PC parts usually under 90 minutes in hub zones, authorised brand dealers, free warranty pickup, free technical support, and GST invoices with input credit.",
};

const SECTIONS = [...ASPERA_TRUST_STRIP, ASPERA_PRICE_PROMISE] as const;

export default function WhyAsperaPage() {
  return (
    <main className="container-shell py-10 md:py-14">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Why Aspera
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Built for PC buyers who need parts now — and support after
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        Aspera runs authorised dealer stock from nearby hubs — minutes when
        you’re in zone — then backs the buy with warranty pickup, free tech
        support, and GST invoices. Six promises. One goal: make courier waits
        feel outdated.
      </p>

      <ol className="mt-10 space-y-8">
        {SECTIONS.map((section, index) => (
          <li
            key={section.id}
            id={section.id}
            className="scroll-mt-28 border-t border-border/80 pt-8 first:border-t-0 first:pt-0"
          >
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground">
              {section.label.replace(/\*$/, "")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted md:text-base">
              {section.body}
            </p>
            {section.id === "express" ? (
              <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted">
                {ASPERA_PROMO.finePrint}{" "}
                <Link
                  href="/shipping"
                  className="font-medium text-accent hover:underline"
                >
                  Shipping details →
                </Link>
              </p>
            ) : null}
            {section.id === "gst" ? (
              <p className="mt-3">
                <Link
                  href="/account/business"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Add business GSTIN →
                </Link>
              </p>
            ) : null}
            {section.id === "tech" ? (
              <p className="mt-3 text-sm text-muted">
                Support:{" "}
                <a
                  href={`mailto:${siteContact.supportEmail}`}
                  className="font-medium text-accent hover:underline"
                >
                  {siteContact.supportEmail}
                </a>
                {" · "}
                <a
                  href={`tel:${siteContact.supportPhoneTel}`}
                  className="font-medium text-accent hover:underline"
                >
                  {siteContact.supportPhoneDisplay}
                </a>
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/browse" className="btn-cta btn-cta-primary">
          Shop Express parts
        </Link>
        <Link href="/buyer-protection" className="btn-cta btn-cta-ghost">
          Buyer protection
        </Link>
        <Link href="/shipping" className="btn-cta btn-cta-ghost">
          Shipping info
        </Link>
      </div>
    </main>
  );
}
