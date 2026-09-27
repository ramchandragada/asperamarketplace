import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { actorHasSellerCapability } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller finance · Aspera Marketplace" };

export default async function SellerFinancePage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "finance.read");
  if (!seller) {
    return (
      <EmptyState
        title="Finance access unavailable"
        description="Requires seller owner or seller finance role for an approved seller."
      />
    );
  }
  if (!actorHasSellerCapability(actor, seller.id, "finance.read") && seller.ownerUserId !== actor.userId) {
    return (
      <EmptyState
        title="Forbidden"
        description="Your seller role cannot view settlements. Ask the seller owner for finance access."
      />
    );
  }

  const batches = await prisma.settlementBatch.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Finance & payouts</h1>
        <p className="mt-2 text-sm text-muted">
          Read-only settlement batches for{" "}
          {seller.tradeName ?? seller.legalName}. Releases remain admin-operated.
        </p>
      </header>
      {batches.length === 0 ? (
        <EmptyState
          title="No settlement batches yet"
          description="Batches appear after finance operators create them from delivered groups."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {batches.map((batch) => (
            <li key={batch.id}>
              <Card className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{batch.batchNumber}</p>
                  <p className="text-sm text-muted">
                    {formatPaise(batch.netPaise)} net · {formatPaise(batch.commissionPaise)}{" "}
                    commission
                  </p>
                </div>
                <Badge
                  tone={
                    batch.status === "paid" || batch.status === "released"
                      ? "success"
                      : batch.status === "held"
                        ? "warning"
                        : "info"
                  }
                >
                  {batch.status}
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Link href="/seller" className="text-sm underline">
        Back to dashboard
      </Link>
    </div>
  );
}
