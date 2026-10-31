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
  const demoPay = mockSelfPayAllowed();

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
          {demoPay
            ? "This environment still allows demo self-pay on unpaid orders. Saved UPI and cards will appear after Razorpay goes live."
            : "Live card/UPI checkout is being connected. Unpaid orders stay awaiting payment until Razorpay is enabled — buyers cannot mark orders paid themselves."}
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm">
        <p className="font-semibold">Available now</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          {demoPay ? <li>· Demo payment on unpaid orders (non-production only)</li> : null}
          <li>· Invoice download from each paid order</li>
          <li>· Refund history on cancelled / returned lines</li>
        </ul>
        <p className="mt-4 font-semibold">Coming with live payments</p>
        <ul className="mt-2 flex flex-col gap-1 text-muted">
          <li>· Razorpay checkout (UPI, cards, netbanking)</li>
          <li>· Saved UPI handles</li>
          <li>· Tokenized cards</li>
          <li>· Wallet / gift balance</li>
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
