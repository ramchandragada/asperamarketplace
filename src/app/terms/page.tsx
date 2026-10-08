import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Terms",
  description: "Purchase terms for orders placed on this demo storefront.",
};

export default function TermsPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Terms</h1>
      <p className="mt-2 text-muted">
        Prices on a listing are in INR and include the amount due for that item
        before delivery fees. Delivery fees, when they apply, are shown at
        checkout.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Stock on the product page is the quantity available to order.</li>
        <li>
          Eligible orders can be returned. See the returns page for the current
          guidance.
        </li>
        <li>
          Checkout on this demo uses a signed mock payment. No live card is
          charged.
        </li>
      </ul>
      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/returns" className="text-accent underline">
          Returns
        </Link>
        <Link href="/shipping" className="text-accent underline">
          Shipping
        </Link>
        <Link href="/privacy" className="text-accent underline">
          Privacy
        </Link>
      </p>
    </PageShell>
  );
}
