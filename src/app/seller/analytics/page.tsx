import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { sellerHealth, trackAnalyticsEvent } from "@/modules/analytics/service";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller analytics · Aspera Marketplace" };

export default async function SellerAnalyticsPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "analytics.read");
  if (!seller) {
    return (
      <EmptyState
        title="Analytics unavailable"
        description="Approved seller staff access required."
      />
    );
  }

  await trackAnalyticsEvent(actor, {
    eventName: "seller_dashboard_view",
    sellerId: seller.id,
  });
  const health = await sellerHealth(actor, seller.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Seller health</h1>
        <p className="mt-2 text-muted">
          Fulfilment mix, returns, and settled net for{" "}
          {seller.tradeName ?? seller.legalName}.
        </p>
      </div>
      <Card className="space-y-1 p-4 text-sm">
        <p>Approved products: {health.approvedProducts}</p>
        <p>Open returns: {health.openReturns}</p>
        <p>
          Settled batches: {health.settledBatches} ·{" "}
          {formatPaise(health.settledNetPaise)}
        </p>
      </Card>
      <Card className="p-4">
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
      </Card>
      <Link href="/seller" className="text-sm underline">
        Dashboard
      </Link>
    </div>
  );
}
