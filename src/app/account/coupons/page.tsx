import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountCouponsPanel } from "@/components/account-coupons-panel";
import { listCouponWallet } from "@/modules/account/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Coupons" };

export default async function AccountCouponsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/coupons");
  }
  const wallet = await listCouponWallet(actor);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Payments & savings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">My Coupons</h1>
        <p className="mt-2 text-muted">
          Available codes, past redemptions, and expired offers.
        </p>
      </div>

      <AccountCouponsPanel wallet={wallet} />

      <p className="text-sm">
        <Link href="/checkout" className="underline">
          Go to checkout
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </div>
  );
}
