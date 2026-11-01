import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PrivacyRequestPanel } from "@/components/privacy-request-panel";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { listPrivacyRequests } from "@/modules/trust/service";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Privacy policy",
  description:
    "How Aspera Technologies Private Limited processes personal data on Aspera Express under applicable Indian privacy law.",
};

export default async function PrivacyPage() {
  const actor = await getOptionalActor();
  const requests = actor ? await listPrivacyRequests(actor) : [];

  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">
        Last updated: 1 November 2026. This policy applies to {asperaLegal.website}{" "}
        operated by {asperaLegal.legalEntity}.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Who we are</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        The data fiduciary for this marketplace is {asperaLegal.legalEntity}{" "}
        (CIN {asperaLegal.cin}). Contact: {asperaLegal.supportEmail},{" "}
        {asperaLegal.supportPhoneDisplay}. Postal:{" "}
        {asperaLegal.grievanceOfficer.postalAddress.join(", ")}.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. What we collect</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
        <li>Account identifiers: name, email, phone, password hash / OTP tokens</li>
        <li>Delivery addresses and optional buyer GSTIN for B2B invoicing</li>
        <li>Order, payment reference, refund, and return records</li>
        <li>Device / log data needed for security and fraud prevention</li>
        <li>
          Seller KYC: PAN, GSTIN, bank account (masked at rest where applicable),
          and uploaded documents
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">3. Purpose and legal use</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        We process personal data to create accounts, fulfil orders, collect
        prepaid payments, settle sellers (including TCS under section 52),
        handle returns and grievances, meet GST / accounting obligations, and
        secure the platform. We do not sell personal data.
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. Processors and sharing</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Data may be processed by: payment gateway (prepaid capture and webhooks),
        hosting / database providers, email or SMS OTP providers, and logistics
        partners engaged for a specific order. Sellers receive the fulfilment
        details needed to ship your order. Authorities may receive data when
        required by law (including GST returns such as GSTR-8 prepared from
        platform records).
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Retention</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Account and order records are retained for the period required for
        tax, dispute, and consumer-protection compliance (typically multi-year
        for invoices and TCS trails), then deleted or anonymised when no longer
        needed.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Your rights</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Subject to applicable law (including the Digital Personal Data
        Protection Act, 2023 once fully in force for this processing), you may
        request access, correction, erasure, or nomination. Use the form below
        when signed in, or email {asperaLegal.grievanceEmail}.
      </p>

      {actor ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Privacy requests</h2>
          <p className="mt-1 text-sm text-muted">
            Submit access, erasure, correction, or portability requests.
          </p>
          <div className="mt-4">
            <PrivacyRequestPanel initialRequests={requests} />
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-[var(--radius)] border border-border bg-surface p-4 text-sm">
          <Link
            href="/login?next=/privacy"
            className="font-medium text-accent underline"
          >
            Sign in
          </Link>{" "}
          to submit a privacy request.
        </p>
      )}

      <p className="mt-6 text-sm">
        <Link href="/grievance" className="text-accent underline">
          Grievance officer
        </Link>
      </p>
      <LegalImprint />
    </PageShell>
  );
}
