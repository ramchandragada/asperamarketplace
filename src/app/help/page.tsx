import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Help centre",
  description:
    "Orders, Express delivery, payments, returns, and grievance contacts for Aspera Marketplace.",
};

const TOPICS = [
  {
    title: "Orders & tracking",
    body: "Sign in and open Orders for live status. Express hub orders usually move within minutes of payment confirmation.",
    href: "/orders",
  },
  {
    title: "Delivery ETAs",
    body: "Pin-specific Express windows are shown on the product page and checkout. Hub zones are typically under 90 minutes when stock is local.",
    href: "/shipping",
  },
  {
    title: "Payments & GST",
    body: "Listed prices exclude GST; estimated tax is added at cart/checkout. Business buyers can add a GSTIN under account business settings.",
    href: "/account",
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
        Quick answers for shoppers on Aspera. For seller onboarding, use{" "}
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
          For unresolved complaints under India consumer / e-commerce rules
          (demo contact):
        </p>
        <ul className="mt-2 space-y-1 text-sm text-foreground">
          <li>
            Email:{" "}
            <a
              href="mailto:grievance@asperamarketplace.example"
              className="font-medium text-accent underline"
            >
              grievance@asperamarketplace.example
            </a>
          </li>
          <li>Phone: +91 00000 00000 (demo)</li>
          <li>Response target: within 48 business hours</li>
        </ul>
        <p className="mt-3 text-sm">
          Or write to{" "}
          <Link href="/support" className="font-semibold text-accent underline">
            Customer support
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
