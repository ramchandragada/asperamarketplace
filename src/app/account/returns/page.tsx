import Link from "next/link";
import { redirect } from "next/navigation";
import { listReturnsForBuyer } from "@/modules/fulfilment/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns" };

export default async function AccountReturnsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/returns");
  }
  const returns = await listReturnsForBuyer(actor);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Shopping
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Returns</h1>
        <p className="mt-2 text-muted">
          Track return requests. Start a new return from a delivered order.
        </p>
      </div>

      {returns.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-border bg-surface p-5 text-sm text-muted">
          No return requests yet.{" "}
          <Link href="/orders" className="text-accent underline">
            Open an order
          </Link>{" "}
          after delivery to request a return.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {returns.map((entry) => (
            <li
              key={entry.id}
              className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/orders/${entry.order.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {entry.order.orderNumber}
                </Link>
                <span className="capitalize text-muted">{entry.status}</span>
              </div>
              <p className="mt-1">
                Qty {entry.quantity} · {entry.reason}
              </p>
              {entry.refund ? (
                <p className="mt-1 text-muted">
                  Refund {entry.refund.status} · ₹
                  {(entry.refund.amountPaise / 100).toFixed(2)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm">
        <Link href="/orders" className="underline">
          Your orders
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </div>
  );
}
