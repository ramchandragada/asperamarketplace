import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Terms of use",
  description:
    "Buyer terms for Aspera Express — contract of sale with the seller; Aspera Technologies Private Limited acts as electronic commerce operator.",
};

export default function TermsPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Terms of use</h1>
      <p className="mt-2 text-sm text-muted">
        Last updated: 1 November 2026. These terms govern purchases on{" "}
        {asperaLegal.website} operated by {asperaLegal.legalEntity}.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Marketplace role</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {asperaLegal.legalEntity} operates {asperaLegal.marketplaceName} as an
        electronic commerce operator. Listings are offers by independent
        sellers. When you place an order, the{" "}
        <strong className="text-foreground">contract of sale is formed with
        the seller</strong> identified on the product page. Aspera facilitates
        discovery, prepaid payment collection, order messaging, and settlement.
        Aspera deducts TCS under CGST Act section 52 on taxable supplies made
        through the platform by third-party sellers, using GSTIN{" "}
        {asperaLegal.gstinTcs}.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Prices and tax</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Listed prices are in Indian Rupees and are shown inclusive of applicable
        GST unless stated otherwise. Delivery fees, when charged, appear at
        checkout. TCS is collected from the seller’s proceeds and does not
        increase the price you pay. Business buyers may add a GSTIN under
        account settings so invoices can reflect that GSTIN where applicable.
      </p>

      <h2 className="mt-8 text-lg font-semibold">3. Payment</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Checkout currently offers cash on delivery on serviceable Pune Express
        pins. COD orders are confirmed when placed; you pay the delivery partner
        on arrival. Online prepaid (UPI / card / netbanking) will be offered
        once the payment gateway is enabled — those orders are treated as paid
        only after the gateway webhook confirms capture.
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. Stock, delivery, cancellation</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Stock shown on a listing is the quantity the seller has offered for
        sale. Delivery is available only to serviceable pincodes (see{" "}
        <Link href="/shipping" className="text-accent underline">
          Shipping
        </Link>
        ). If a seller cannot fulfil after payment, Aspera will arrange a refund
        to the original payment method under the returns and cancellation
        policy. Buyer-initiated cancellations after dispatch follow the returns
        rules.
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Returns and warranties</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Eligible returns are described on the{" "}
        <Link href="/returns" className="text-accent underline">
          returns
        </Link>{" "}
        page. Brand warranty, where applicable, is honoured by the brand or the
        seller as stated on the product page — not automatically by Aspera
        unless Aspera is the named warrantor for that SKU.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Acceptable use</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        You must provide accurate account and delivery details, not abuse
        promotions, and not use the site for unlawful goods or fraud. Aspera may
        suspend accounts that violate these terms or applicable law.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Limitation of liability</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        To the fullest extent permitted by law, Aspera’s liability for platform
        facilitation is limited to the fees Aspera earned on the disputed order.
        Product quality, title, and fitness for purpose are the seller’s
        responsibility, subject to mandatory consumer protections that cannot be
        waived.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Governing law</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {asperaLegal.governingLaw}. For grievances, see{" "}
        <Link href="/grievance" className="text-accent underline">
          /grievance
        </Link>
        .
      </p>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/privacy" className="text-accent underline">
          Privacy
        </Link>
        <Link href="/shipping" className="text-accent underline">
          Shipping
        </Link>
        <Link href="/returns" className="text-accent underline">
          Returns
        </Link>
      </p>
      <LegalImprint />
    </PageShell>
  );
}
