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
          Cash on delivery is available on Pune Express pins. Online prepaid
          (UPI / card / netbanking) returns when the payment gateway goes live.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <p className="font-semibold">Available</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Cash on delivery (pay the delivery partner on arrival)</li>
          <li>· Invoice download from each confirmed order</li>
          <li>· Refund history on cancelled / returned lines</li>
          {selfPay ? (
            <li>
              · Development self-pay helper enabled in this environment (not for
              production buyers)
            </li>
          ) : null}
        </ul>
        <p className="mt-4 font-semibold">Coming next</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Online prepaid via Razorpay (UPI / card / netbanking)</li>
          <li>· Saved cards / UPI handles after gateway tokenization</li>
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
