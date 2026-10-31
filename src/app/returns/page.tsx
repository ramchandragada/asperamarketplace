import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Return policy",
  description:
    "7-day easy returns on eligible Aspera PC parts — prepaid orders, hub pickup where available.",
};

export default function ReturnsPage() {
  return (
    <PageShell narrow>
      <h1 className="font-display text-3xl font-semibold">Return policy</h1>
      <p className="mt-3 text-muted">
        Most in-stock PC components sold on Aspera can be returned within{" "}
        <strong className="text-foreground">7 days of delivery</strong> if they
        are unused, in original packaging, with all accessories and seals
        intact.
      </p>

      <h2 className="mt-8 text-lg font-semibold">How returns work</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
        <li>Open Orders and choose the item you want to return.</li>
        <li>Pick a reason and request a pickup (hub zones) or drop-off.</li>
        <li>
          Once the seller / hub inspects the item, refunds go to the original
          payment method (or store credit for COD).
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">Not eligible</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Opened software, licences, or digital goods</li>
        <li>Items damaged by misuse or missing parts</li>
        <li>Custom-built PCs after successful burn-in, unless DOA</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">Warranty vs returns</h2>
      <p className="mt-3 text-sm text-muted">
        Brand warranty (often 2–3 years on components) is separate from the
        7-day return window. For in-warranty failures after the return period,
        use{" "}
        <Link href="/why-aspera#warranty" className="font-medium text-accent underline">
          Aspera warranty pickup
        </Link>
        .
      </p>

      <p className="mt-8 text-sm">
        <Link href="/support" className="font-semibold text-accent underline">
          Contact support
        </Link>{" "}
        or see{" "}
        <Link href="/help" className="font-semibold text-accent underline">
          Help centre
        </Link>
        .
      </p>
    </PageShell>
  );
}
