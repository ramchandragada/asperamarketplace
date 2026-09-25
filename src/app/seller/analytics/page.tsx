import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { sellerHealth, trackAnalyticsEvent } from "@/modules/analytics/service";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller analytics · Aspera Marketplace" };

export default async function SellerAnalyticsPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await prisma.seller.findFirst({
    where: { ownerUserId: actor.userId, status: "approved" },
    orderBy: { createdAt: "asc" },
  });
  if (!seller) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold">Seller analytics</h1>
        <p className="text-muted">Approved seller profile required.</p>
        <Link href="/seller/onboarding" className="underline">
          Onboarding
        </Link>
      </main>
    );
  }

  await trackAnalyticsEvent(actor, {
    eventName: "seller_dashboard_view",
    sellerId: seller.id,
  });
  const health = await sellerHealth(actor, seller.id);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Seller
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Health</h1>
        <p className="mt-2 text-muted">
          Fulfilment mix, returns, and settled net for{" "}
          {seller.tradeName ?? seller.legalName}.
        </p>
      </div>
      <section className="text-sm">
        <p>Approved products: {health.approvedProducts}</p>
        <p>Open returns: {health.openReturns}</p>
        <p>
          Settled batches: {health.settledBatches} ·{" "}
          {formatPaise(health.settledNetPaise)}
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Fulfilment</h2>
        <ul className="mt-2 text-sm">
          {health.fulfilmentByStatus.map((row) => (
            <li key={row.status}>
              {row.status}: {row.count} · {formatPaise(row.lineTotalPaise)}
            </li>
          ))}
          {health.fulfilmentByStatus.length === 0 ? (
            <li className="text-muted">No fulfilment groups yet.</li>
          ) : null}
        </ul>
      </section>
      <p className="text-sm">
        <Link href="/seller/fulfilment" className="underline">
          Fulfilment
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
