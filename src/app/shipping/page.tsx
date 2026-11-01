import Link from "next/link";
import type { Metadata } from "next";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata: Metadata = {
  title: "Shipping policy",
  description:
    "Prepaid delivery on Aspera Express — currently serviceable for configured Pune 411xxx pins; fulfilled by the selling dealer.",
};

export default function ShippingPage() {
  return (
    <PageShell narrow>
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Shipping
      </p>
      <h1 className="font-display mt-2 text-3xl font-semibold">
        Delivery on Aspera Express
      </h1>
      <p className="mt-3 text-muted leading-7">
        Orders are fulfilled by the selling dealer from their shop stock unless
        a listing expressly states fulfilment from an Aspera-operated warehouse
        (none are configured for Express PC parts at launch). We do not brand a
        dealer shop as an “Aspera Fulfilment Centre”.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Serviceable area</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {asperaLegal.serviceableAreaSummary}. Set your pincode in the header to
        see whether a listing can ship to you and the quoted ETA. Pins outside
        the configured table are not offered at checkout.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Pune Express (411xxx)</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        For in-stock items from approved Pune sellers, typical windows are under
        90 minutes where the pincode table marks Express. Large cabinets,
        monitors, and UPS may take longer within the quoted window. Exact
        minutes depend on live stock and the seller’s pickup readiness.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Payment and dispatch</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>Cash on delivery available on Pune Express pins; online prepaid returns when the gateway goes live.</li>
        <li>
          Dispatch starts after the payment gateway webhook confirms capture.
        </li>
        <li>
          If the seller cannot fulfil after payment, we cancel the unfulfilled
          lines and refund the captured amount to the original method.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">What we do not claim</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Aspera Express does not currently operate Express hubs in Mumbai, Delhi,
        Bengaluru, Hyderabad, Chennai, Kolkata, or Ahmedabad for this
        marketplace. Those cities are not listed as serviceable until pins and
        approved seller or warehouse capacity exist in our configuration.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/browse" className="btn-cta btn-cta-primary">
          Browse components
        </Link>
        <Link href="/returns" className="btn-cta btn-cta-ghost">
          Returns
        </Link>
      </div>
      <LegalImprint />
    </PageShell>
  );
}
