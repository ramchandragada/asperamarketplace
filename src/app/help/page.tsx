import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Help centre",
  description:
    "Orders, Express delivery, payments, returns, and grievance contacts for Aspera Express.",
};

const TOPICS = [
  {
    title: "Orders & tracking",
    body: "Sign in and open Orders for status. COD orders confirm immediately; prepaid orders dispatch after gateway capture.",
    href: "/orders",
  },
  {
    title: "Delivery ETAs",
    body: "Pin-specific windows appear on the product page and checkout. Serviceable area is limited to configured pins (Pune 411xxx Express today).",
    href: "/shipping",
  },
  {
    title: "Payments & GST",
    body: "Listed prices include applicable GST presentation at checkout. Business buyers can add a GSTIN under account business settings. The seller issues the goods invoice; Aspera collects TCS as ECO.",
    href: "/account/business",
  },
  {
    title: "Returns",
    body: "Eligible unused items can be returned within 7 days of delivery.",
    href: "/returns",
  },
] as const;

export default function HelpPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Help centre</h1>
      <p className="mt-3 text-muted">
        Quick answers for shoppers on {asperaLegal.marketplaceName}. For seller
        onboarding, use{" "}
        <Link href="/sell" className="font-medium text-accent underline">
          Sell on Aspera
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-4">
        {TOPICS.map((topic) => (
          <article
            key={topic.href}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <h2 className="font-semibold text-foreground">{topic.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{topic.body}</p>
            <Link
              href={topic.href}
              className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
            >
              Open →
            </Link>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-[var(--radius)] border border-border bg-accent-soft/40 p-4">
        <h2 className="font-semibold text-foreground">Grievance officer</h2>
        <p className="mt-2 text-sm text-muted">
          Unresolved consumer complaints under the Consumer Protection
          (E-commerce) Rules, 2020:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-foreground">
          <li>
            {asperaLegal.grievanceOfficer.name} (
            {asperaLegal.grievanceOfficer.designation})
          </li>
          <li>
            Email:{" "}
            <a
              href={`mailto:${asperaLegal.grievanceEmail}`}
              className="font-medium text-accent underline"
            >
              {asperaLegal.grievanceEmail}
            </a>
          </li>
          <li>Phone: {asperaLegal.grievanceOfficer.phoneDisplay}</li>
          <li>Acknowledgement within 48 hours; redressal within one month</li>
        </ul>
        <p className="mt-3 text-sm">
          Full details:{" "}
          <Link
            href="/grievance"
            className="font-semibold text-accent underline"
          >
            /grievance
          </Link>
          {" · "}
          <Link href="/support" className="font-semibold text-accent underline">
            Customer support
          </Link>
        </p>
      </section>
      <LegalImprint />
    </PageShell>
  );
}
