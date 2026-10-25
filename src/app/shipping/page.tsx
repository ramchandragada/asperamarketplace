import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aspera Express shipping",
  description:
    "Minute-level PC-parts delivery from nearby hubs — Pune Express under 90 minutes, same-day across major metros.",
};

const TIERS = [
  {
    title: "Pune Express",
    eta: "45–90 minutes",
    body: "In-stock CPUs, boards, GPUs, SSDs, and peripherals from local hubs when your pin starts with 411.",
  },
  {
    title: "Metro same-day",
    eta: "2–4 hours",
    body: "Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, and Ahmedabad hubs for Express windows while stock lasts.",
  },
  {
    title: "Wider India",
    eta: "Today / tomorrow morning",
    body: "Serviceable pins outside Express hubs still get prepaid delivery with a clear ETA at checkout.",
  },
] as const;

export default function ShippingPage() {
  return (
    <main className="container-shell py-10 md:py-14">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Aspera Express
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        Delivery in minutes, not days
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
        Aspera runs a quick-commerce model for PC components — set your pincode
        once, see a live ETA, and get in-stock parts from nearby seller hubs.
        Inspired by the speed of Blinkit, Zepto, and Bigbasket, tuned for
        builders.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.title}
            className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]"
          >
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {tier.title}
            </p>
            <p className="font-display mt-2 text-2xl font-bold text-accent">
              {tier.eta}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">{tier.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-10 max-w-2xl space-y-3 text-sm leading-6 text-muted">
        <h2 className="font-display text-xl font-bold text-foreground">
          How Express works
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Set your delivery pincode in the header location bar.</li>
          <li>
            We quote an ETA in minutes for Express hubs, or a same-day window
            elsewhere.
          </li>
          <li>Checkout is prepaid — no cash on delivery yet.</li>
          <li>
            Large cabinets, monitors, and UPS may move in the upper end of the
            quoted window.
          </li>
          <li>7-day easy returns on eligible parts after delivery.</li>
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/browse" className="btn-cta btn-cta-primary">
          Start shopping
        </Link>
        <Link href="/buyer-protection" className="btn-cta btn-cta-ghost">
          Buyer protection
        </Link>
      </div>
    </main>
  );
}
