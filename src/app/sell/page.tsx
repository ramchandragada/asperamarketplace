import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Sell on Aspera Express",
  description:
    "Sell PC components on Aspera Express — KYC-approved dealers, TCS under section 52, prepaid settlement.",
};

const BENEFITS = [
  {
    title: "PC-parts buyers",
    body: "Reach builders shopping processors, boards, GPUs, memory, and storage — not a general merchandise mall.",
  },
  {
    title: "You remain the supplier",
    body: "Tax invoices go out on your Regular GSTIN. Aspera is the ECO and deducts TCS under section 52.",
  },
  {
    title: "KYC before go-live",
    body: "Admin reviews GSTIN, pickup address, and bank details. Only approved sellers get live listings.",
  },
  {
    title: "Clear settlement",
    body: "Gross, commission, TCS, and net payable appear in Seller Central with T+7 / weekly payout batches.",
  },
];

export default function SellLandingPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-accent text-accent-foreground">
        <div className="container-shell flex flex-col gap-5 py-14 md:py-20">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-90">
            Sellers · {asperaLegal.legalEntity}
          </p>
          <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Sell PC parts on Aspera Express
          </h1>
          <p className="max-w-xl text-base opacity-90">
            Multi-vendor marketplace for authorised component dealers. Prepaid
            orders, section 52 TCS via GSTIN {asperaLegal.gstinTcs}, serviceable
            pins configured honestly ({asperaLegal.serviceableAreaSummary}).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register?intent=seller&next=%2Fseller%2Fonboarding"
              className="inline-flex w-fit rounded-[var(--radius-sm)] bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Create seller account
            </Link>
            <Link
              href="/login?next=%2Fseller%2Fonboarding"
              className="inline-flex w-fit rounded-[var(--radius-sm)] border border-white/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>
      <PageShell>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-[var(--radius)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <h2 className="font-semibold">{benefit.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{benefit.body}</p>
            </article>
          ))}
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-accent-soft p-6 text-center">
          <h2 className="font-display text-2xl font-semibold">
            Read the seller agreement
          </h2>
          <p className="mt-2 text-sm text-muted">
            Listing standards, prohibited goods, commission, TCS, and
            suspension rules.
          </p>
          <Link
            href="/seller-policies"
            className="mt-4 inline-flex rounded-[var(--radius-sm)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            Seller policies
          </Link>
        </div>
        <LegalImprint />
      </PageShell>
    </div>
  );
}
