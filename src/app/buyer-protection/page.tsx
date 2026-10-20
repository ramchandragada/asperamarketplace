import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { siteContact } from "@/platform/config/site-contact";

export const metadata = { title: "Buyer Protection" };

export default function BuyerProtectionPage() {
  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Trust
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Buyer Protection
        </h1>
        <p className="mt-3 text-muted leading-7">
          Aspera Marketplace stands behind eligible purchases. If something goes
          wrong with delivery, product accuracy, or an unresolved return, you
          can file a Buyer Protection claim from your order page.
        </p>
      </div>

      <section className="mt-8 space-y-4 text-sm leading-7">
        <h2 className="text-lg font-semibold">When you can claim</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted">
          <li>
            <span className="font-medium text-foreground">Not delivered</span> —
            paid order still undelivered after the delivery SLA window.
          </li>
          <li>
            <span className="font-medium text-foreground">Not as described</span>{" "}
            — item delivered but materially different from the listing.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Return not honoured
            </span>{" "}
            — approved return request left unresolved past the seller SLA.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4 text-sm leading-7">
        <h2 className="text-lg font-semibold">How claims are decided</h2>
        <p className="text-muted">
          Our trust team reviews your order, messages, and return history. If
          approved, we issue a refund and record a seller-side debit. Frequency
          limits apply to keep the programme fair.
        </p>
      </section>

      <section className="mt-8 space-y-2 text-sm">
        <h2 className="text-lg font-semibold">Need help?</h2>
        <p className="text-muted">
          Email{" "}
          <a
            href={`mailto:${siteContact.supportEmail}`}
            className="font-medium text-accent hover:underline"
          >
            {siteContact.supportEmail}
          </a>{" "}
          or call {siteContact.supportPhoneDisplay}.
        </p>
        <p>
          <Link href="/orders" className="font-semibold text-accent hover:underline">
            Go to your orders →
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
