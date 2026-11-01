import Link from "next/link";
import { LegalImprint } from "@/components/legal-imprint";
import { PageShell } from "@/components/ui/page-shell";
import { asperaLegal } from "@/platform/config/aspera-legal";

export const metadata = {
  title: "Return policy",
  description:
    "7-day returns on eligible prepaid PC parts sold via Aspera Express — reverse logistics and refund SLA.",
};

export default function ReturnsPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Return policy</h1>
      <p className="mt-3 text-muted leading-7">
        Most eligible PC components sold through {asperaLegal.marketplaceName}{" "}
        may be returned within{" "}
        <strong className="text-foreground">7 days of delivery</strong> if
        unused, in original packaging, with seals and accessories intact.
        Returns are processed against the original order; COD refunds are
        settled as store credit or bank transfer after inspection.
      </p>

      <h2 className="mt-8 text-lg font-semibold">How to return</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>Open Orders and select the delivered line you want to return.</li>
        <li>Choose a reason and request pickup or drop-off as offered.</li>
        <li>
          After the seller inspects the item, refunds go to the original
          payment method within 5–7 business days of approval (gateway timelines
          may add a few days).
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">Who pays reverse logistics</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        If the return is due to seller error, damaged-in-transit, or wrong item,
        reverse logistics are on the seller / platform as arranged for that
        order. Change-of-mind returns on eligible sealed goods may require the
        buyer to bear reverse shipping when stated at request time.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Not eligible / restricted</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Opened CPUs, GPUs, or other components where the anti-static /
          retail seal is broken (unless DOA on arrival)</li>
        <li>Opened software, licences, or digital goods</li>
        <li>Items damaged by misuse or missing parts / accessories</li>
        <li>Custom-built PCs after successful burn-in, unless DOA</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Warranty vs returns</h2>
      <p className="mt-3 text-sm text-muted leading-6">
        Brand warranty (often multi-year on components) is separate from the
        7-day return window. The product page states who honours warranty. After
        the return window, use the seller or brand channel named on the listing.
      </p>

      <p className="mt-8 text-sm">
        <Link href="/support" className="font-semibold text-accent underline">
          Contact support
        </Link>
        {" · "}
        <Link href="/grievance" className="font-semibold text-accent underline">
          Grievance officer
        </Link>
      </p>
      <LegalImprint />
    </PageShell>
  );
}
