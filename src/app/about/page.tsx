import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "About us",
  description:
    "Aspera Express is a multi-vendor PC-parts marketplace operated by Aspera Technologies Private Limited as an electronic commerce operator under GST.",
};

export default function AboutPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">About Aspera Express</h1>
      <p className="mt-3 text-muted leading-7">
        {asperaLegal.marketplaceName} ({asperaLegal.website}) is a multi-vendor
        marketplace for PC components operated by{" "}
        <strong className="text-foreground">{asperaLegal.legalEntity}</strong>{" "}
        (CIN {asperaLegal.cin}). We focus on processors, motherboards, graphics
        cards, memory, storage, cabinets, and related PC parts — not a
        general-merchandise catalogue.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Who sells and who invoices</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Third-party sellers list and supply goods from their own stock. The{" "}
        <strong className="text-foreground">contract of sale is between you and
        the seller</strong>. The tax invoice for goods is issued under the
        seller’s Regular GSTIN. Aspera is the electronic commerce operator
        (ECO): we host the catalogue, collect prepaid payment, and deduct tax
        collected at source (TCS) under section 52 of the CGST Act using TCS
        GSTIN <strong className="text-foreground">{asperaLegal.gstinTcs}</strong>.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Where we deliver today</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Serviceable delivery is limited to pins we have configured — currently{" "}
        {asperaLegal.serviceableAreaSummary}. Exact ETA appears after you set a
        pincode. We do not claim pan-India Express hubs or Aspera fulfilment
        centres that we do not operate.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Company details</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>Legal name: {asperaLegal.legalEntity}</li>
        <li>CIN: {asperaLegal.cin}</li>
        <li>PAN: {asperaLegal.pan}</li>
        <li>Regular GSTIN (MH): {asperaLegal.gstinRegular}</li>
        <li>TCS / ECO GSTIN (MH): {asperaLegal.gstinTcs}</li>
        <li>TCS PPoB: {asperaLegal.tcsPpob.lines.join(", ")}</li>
      </ul>

      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/terms" className="text-accent underline">
          Terms
        </Link>
        <Link href="/seller-policies" className="text-accent underline">
          Seller policies
        </Link>
        <Link href="/grievance" className="text-accent underline">
          Grievance officer
        </Link>
      </p>
      <LegalImprint />
    </PageShell>
  );
}
