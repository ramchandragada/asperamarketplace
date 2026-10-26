import Link from "next/link";
import type { ReactNode } from "react";
import {
  ASPERA_PDP_PROMISES,
  ASPERA_TRUST_STRIP,
  type AsperaPromise,
} from "@/lib/aspera-promises";

function IconExpress() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 13h11l2.5-6H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M14 13V8H8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGenuine() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4.5 6v6.2c0 4.4 3.1 7.4 7.5 8.8 4.4-1.4 7.5-4.4 7.5-8.8V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11.2 14l3.4-3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWarranty() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8H4a8 8 0 1 1-1.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 4v4H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTech() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconGst() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h7l3 3v15H7V3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 11h5M9.5 14.5h5M9.5 8h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS: Record<AsperaPromise["id"], () => ReactNode> = {
  express: IconExpress,
  genuine: IconGenuine,
  warranty: IconWarranty,
  tech: IconTech,
  gst: IconGst,
  price: IconGenuine,
};

/**
 * Global / home trust strip — five differentiators.
 * Prefer this over the legacy TrustSignalBar copy.
 */
export function AsperaPromiseStrip({
  className = "",
}: {
  className?: string;
}) {
  return (
    <section
      className={`border-y border-border/70 bg-surface ${className}`.trim()}
      aria-label="Why shop Aspera"
    >
      <ul className="container-shell grid grid-cols-2 gap-x-4 gap-y-3 py-3.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3 md:py-4">
        {ASPERA_TRUST_STRIP.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-start gap-2.5 text-left transition-colors hover:text-accent"
              >
                <span className="mt-0.5 shrink-0 text-accent">
                  <Icon />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug text-foreground group-hover:text-accent md:text-[14px]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted md:text-[12px]">
                    {item.hint}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="container-shell pb-3 text-[11px] leading-snug text-muted md:pb-3.5">
        *Delivery window depends on your pincode and live stock (typically
        10–90 minutes in Express hub zones).{" "}
        <Link href="/why-aspera" className="font-medium text-accent hover:underline">
          Why Aspera →
        </Link>
      </p>
    </section>
  );
}

/** PDP cluster under the buy box — authorised, warranty pickup, tech support. */
export function PdpPromiseCluster() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">
        Aspera promise
      </p>
      <ul className="mt-3 space-y-3">
        {ASPERA_PDP_PROMISES.map((item) => {
          const Icon = ICONS[item.id];
          return (
            <li key={item.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-accent">
                <Icon />
              </span>
              <span className="min-w-0">
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-foreground hover:text-accent hover:underline"
                >
                  {item.label}
                </Link>
                <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                  {item.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 border-t border-border/70 pt-3 text-[12px] text-muted">
        Express ETA is shown from your pincode ·{" "}
        <Link href="/buyer-protection" className="font-medium text-accent hover:underline">
          Buyer protection
        </Link>
        {" · "}
        <Link href="/why-aspera" className="font-medium text-accent hover:underline">
          Full details
        </Link>
      </p>
    </div>
  );
}

/** Checkout reminder for business GST invoices. */
export function CheckoutGstCallout() {
  return (
    <p className="rounded-xl border border-border bg-surface px-3.5 py-3 text-[13px] leading-snug text-muted">
      <span className="font-semibold text-foreground">GST tax invoice</span> with
      input credit for registered businesses.{" "}
      <Link
        href="/account/business"
        className="font-medium text-accent hover:underline"
      >
        Add GSTIN →
      </Link>
    </p>
  );
}
