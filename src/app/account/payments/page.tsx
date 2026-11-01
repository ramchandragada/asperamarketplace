import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalActor } from "@/modules/identity/service";
import { mockSelfPayAllowed } from "@/modules/payments/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment options" };

export default async function AccountPaymentsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/payments");
  }
  const selfPay = mockSelfPayAllowed();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Payments & savings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Payment options
        </h1>
        <p className="mt-2 text-muted">
          Checkout is prepaid (UPI, card, or netbanking). Orders are marked paid
          only after the payment gateway webhook confirms capture. Cash on
          delivery is not offered.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <p className="font-semibold">Available</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Prepaid payment on unpaid orders</li>
          <li>· Invoice download from each paid order</li>
          <li>· Refund history on cancelled / returned lines</li>
          {selfPay ? (
            <li>
              · Development self-pay helper enabled in this environment (not for
              production buyers)
            </li>
          ) : null}
        </ul>
        <p className="mt-4 font-semibold">Not offered</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Cash on delivery</li>
          <li>· Saved cards / UPI handles until gateway tokenization is enabled</li>
        </ul>
      </div>

      <p className="text-sm">
        <Link href="/orders" className="underline">
          View orders & invoices
        </Link>
      </p>
    </div>
  );
}
