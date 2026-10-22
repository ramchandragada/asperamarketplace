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
export const metadata = { title: "Seller finance" };

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function settlementTone(status: string): "success" | "warning" | "info" {
  if (status === "paid" || status === "released") return "success";
  if (status === "held") return "warning";
  return "info";
}

function settlementLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Awaiting release",
    held: "On hold",
    released: "Released",
    paid: "Paid",
  };
  return map[status] ?? status;
}

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
  if (
    !actorHasSellerCapability(actor, seller.id, "finance.read") &&
    seller.ownerUserId !== actor.userId
  ) {
    return (
      <EmptyState
        title="Forbidden"
        description="Your seller role cannot view settlements. Ask the seller owner for finance access."
      />
    );
  }

  const [batches, paidAgg, pendingAgg, lifetimeAgg] = await Promise.all([
    prisma.settlementBatch.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { lines: true } } },
    }),
    prisma.settlementBatch.aggregate({
      where: { sellerId: seller.id, status: { in: ["paid", "released"] } },
      _sum: { netPaise: true },
    }),
    prisma.settlementBatch.aggregate({
      where: { sellerId: seller.id, status: { in: ["pending", "held"] } },
      _sum: { netPaise: true },
    }),
    prisma.settlementBatch.aggregate({
      where: { sellerId: seller.id },
      _sum: { commissionPaise: true, tcsPaise: true },
    }),
  ]);

  const paidOut = paidAgg._sum.netPaise ?? 0;
  const upcoming = pendingAgg._sum.netPaise ?? 0;
  const lifetimeCommission = lifetimeAgg._sum.commissionPaise ?? 0;
  const lifetimeTcs = lifetimeAgg._sum.tcsPaise ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Finance &amp; payouts</h1>
        <p className="mt-2 text-sm text-muted">
          Payouts for {seller.tradeName ?? seller.legalName}. Each batch settles
          your delivered orders: merchandise, minus marketplace commission and
          TCS (0.5%), equals your net payout. GST collected at checkout is
          remitted separately and isn’t deducted from your payout. Confirm
          filings with a tax professional.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Paid out to date" value={formatPaise(paidOut)} strong />
        <SummaryTile label="Upcoming payout" value={formatPaise(upcoming)} />
        <SummaryTile
          label="Commission (lifetime)"
          value={formatPaise(lifetimeCommission)}
        />
        <SummaryTile label="TCS withheld" value={formatPaise(lifetimeTcs)} />
      </div>

      {batches.length === 0 ? (
        <EmptyState
          title="No settlement batches yet"
          description="A payout batch appears here once your delivered orders are settled."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {batches.map((batch) => {
            const preTcs = batch.grossPaise - batch.commissionPaise;
            return (
              <li key={batch.id}>
                <Card className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{batch.batchNumber}</p>
                      <p className="text-sm text-muted">
                        {batch._count.lines} order
                        {batch._count.lines === 1 ? "" : "s"} ·{" "}
                        {formatDate(batch.periodStart)} –{" "}
                        {formatDate(batch.periodEnd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge tone={settlementTone(batch.status)}>
                        {settlementLabel(batch.status)}
                      </Badge>
                      <p className="mt-1 text-xs text-muted">
                        {batch.paidAt
                          ? `Paid ${formatDate(batch.paidAt)}`
                          : batch.releasedAt
                            ? `Released ${formatDate(batch.releasedAt)}`
                            : "Payout pending"}
                      </p>
                    </div>
                  </div>

                  <dl className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                    <WaterfallRow
                      label="Gross merchandise"
                      value={formatPaise(batch.grossPaise)}
                    />
                    <WaterfallRow
                      label="Marketplace commission"
                      value={`− ${formatPaise(batch.commissionPaise)}`}
                      muted
                    />
                    <WaterfallRow
                      label="Subtotal"
                      value={formatPaise(preTcs)}
                      muted
                    />
                    <WaterfallRow
                      label="TCS withheld (0.5%)"
                      value={`− ${formatPaise(batch.tcsPaise)}`}
                      muted
                    />
                    <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                      <dt className="font-semibold">Net payout</dt>
                      <dd className="text-lg font-semibold">
                        {formatPaise(batch.netPaise)}
                      </dd>
                    </div>
                  </dl>

                  {batch.holdReason ? (
                    <p className="rounded-[var(--radius-sm)] bg-warning-soft px-3 py-2 text-xs text-warning">
                      On hold: {batch.holdReason}
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/seller" className="text-sm underline">
        Back to dashboard
      </Link>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
      <p
        className={`mt-1 ${strong ? "text-2xl font-semibold" : "text-xl font-medium"}`}
      >
        {value}
      </p>
    </Card>
  );
}

function WaterfallRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted" : undefined}>{label}</dt>
      <dd className={muted ? "text-muted" : undefined}>{value}</dd>
    </div>
  );
}
