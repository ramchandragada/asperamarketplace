import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Sell on Aspera Marketplace",
  description: "Start selling on Aspera — reach shoppers across India.",
};

const BENEFITS = [
  {
    title: "Low commission",
    body: "Competitive fees designed for growing Indian sellers.",
  },
  {
    title: "Reach shoppers nationwide",
    body: "List once and sell across categories shoppers already browse.",
  },
  {
    title: "Easy catalogue setup",
    body: "Add products, variants, and inventory from a simple seller dashboard.",
  },
  {
    title: "Fast payouts",
    body: "Transparent settlement flows with clear order and finance views.",
  },
];

export default function SellLandingPage() {
  return (
    <div className="flex flex-col">
      <section className="bg-accent text-accent-foreground">
        <div className="container-shell flex flex-col gap-5 py-14 md:py-20">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-90">
            Aspera sellers
          </p>
          <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
            Sell on Aspera Marketplace
          </h1>
          <p className="max-w-xl text-base opacity-90">
            Launch your brand with verified listings, transparent pricing, and tools
            built for multi-seller commerce.
          </p>
          <Link
            href="/seller/onboarding"
            className="inline-flex w-fit rounded-[var(--radius-sm)] bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white"
          >
            Start selling
          </Link>
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
          <h2 className="font-display text-2xl font-semibold">Ready to list?</h2>
          <p className="mt-2 text-sm text-muted">
            Create your seller profile and submit your first products for review.
          </p>
          <Link
            href="/seller/onboarding"
            className="mt-4 inline-flex rounded-[var(--radius-sm)] bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            Start selling
          </Link>
        </div>
      </PageShell>
    </div>
  );
}
