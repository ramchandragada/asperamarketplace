import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Coupons" };

const COUPONS = [
  {
    code: "ASPERA10",
    title: "10% off merchandise",
    detail: "Applied at checkout. Cap and eligibility follow checkout rules.",
    status: "Available",
  },
];

export default async function AccountCouponsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/coupons");
  }

  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Payments & savings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">My Coupons</h1>
        <p className="mt-2 text-muted">
          Codes you can apply during checkout. More wallet features come after
          live payments.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {COUPONS.map((coupon) => (
          <li
            key={coupon.code}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-lg font-semibold">{coupon.code}</p>
              <span className="text-xs font-medium text-accent">
                {coupon.status}
              </span>
            </div>
            <p className="mt-1 font-medium">{coupon.title}</p>
            <p className="mt-1 text-sm text-muted">{coupon.detail}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm">
        <Link href="/checkout" className="underline">
          Go to checkout
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </PageShell>
  );
}
