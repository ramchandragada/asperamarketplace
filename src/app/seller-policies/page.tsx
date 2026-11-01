import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Seller policies & agreement",
  description:
    "Listing standards, TCS under section 52, commission, and settlement for sellers on Aspera Express.",
};

export default function SellerPoliciesPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">
        Seller policies & agreement
      </h1>
      <p className="mt-3 text-muted leading-7">
        By completing seller onboarding on {asperaLegal.marketplaceName}, you
        agree to these policies with {asperaLegal.legalEntity} (the electronic
        commerce operator). A versioned acceptance (timestamp and IP) is stored
        when you submit KYC.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Eligibility and KYC</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        You must provide legal name, trade name, PAN, Regular GSTIN (validated
        format and State), constitution, principal place of business, pickup
        address, bank account + IFSC, authorised signatory, and category / HSN
        coverage. Listings go live only after admin approval (
        draft → submitted → under_review → approved). Suspended or closed
        sellers cannot sell.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Who supplies and invoices</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        You are the supplier of goods. Tax invoices for goods must be issued
        under your Regular GSTIN. Aspera is not the supplier for third-party
        catalogue stock. Product pages must show your legal name, GSTIN, and
        whether fulfilment is by you (seller shop) or an Aspera-operated
        warehouse when one exists.
      </p>

      <h2 className="mt-8 text-lg font-semibold">3. TCS — section 52</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Aspera collects TCS as ECO under GSTIN {asperaLegal.gstinTcs}. On each
        paid taxable supply through the platform, TCS is deducted from your
        settlement (not added to the buyer’s price): typically 0.5% CGST + 0.5%
        SGST for intra-State supplies or 1% IGST for inter-State, at notified
        rates held in platform config. You remain responsible for your own GST
        returns; Aspera provides GSTR-8 equivalent statements for your records.
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. Commission and settlement</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Category commission percentages are configured by Aspera and shown in
        Seller Central. Net payable = gross − commission − GST on commission −
        TCS − refunds / chargebacks + adjustments. Payouts run on a T+7 (or
        weekly batch) cycle after admin trigger. Aspera invoices commission as
        a supply of service under Regular GSTIN {asperaLegal.gstinRegular}{" "}
        (HSN for intermediary / marketplace services as applicable) — never
        mixing that GSTIN with the TCS GSTIN.
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Listing standards</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>Accurate title, brand, HSN, country of origin, warranty party</li>
        <li>Real stock quantities — no fabricated availability</li>
        <li>No prohibited or non-compliant goods (including unsafe electricals)</li>
        <li>Images you are licensed to use; no misleading badges</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">6. Fulfilment</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Default model: fulfilled by seller from your pickup city. Only inventory
        marked at an Aspera-operated warehouse may say “Fulfilled by Aspera”.
        Failure to dispatch within committed windows may lead to cancellation,
        refunds, and suspension.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Indemnity and suspension</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        You indemnify Aspera against claims arising from your products, GST
        non-compliance, IP infringement, or false listings. Aspera may suspend
        or close the account for policy or legal breaches.
      </p>

      <p className="mt-8 text-sm">
        <Link href="/sell" className="text-accent underline">
          Sell on Aspera
        </Link>
        {" · "}
        <Link href="/seller/onboarding" className="text-accent underline">
          Seller registration
        </Link>
      </p>
      <LegalImprint />
    </PageShell>
  );
}
