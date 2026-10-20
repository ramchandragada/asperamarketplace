import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment options" };

export default async function AccountPaymentsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/payments");
  }

  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Payments & savings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Payment options
        </h1>
        <p className="mt-2 text-muted">
          Checkout currently uses mock pay for development. Saved UPI and cards
          will appear here after Razorpay goes live.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <p className="font-semibold">Available now</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Mock payment on unpaid orders</li>
          <li>· Invoice download from each paid order</li>
          <li>· Refund history on cancelled / returned lines</li>
        </ul>
        <p className="mt-4 font-semibold">Coming with live payments</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Saved UPI handles</li>
          <li>· Tokenized cards</li>
          <li>· Wallet / gift balance</li>
        </ul>
      </div>

      <p className="text-sm">
        <Link href="/orders" className="underline">
          View orders & invoices
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </PageShell>
  );
}
