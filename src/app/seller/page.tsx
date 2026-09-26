import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { getSellerActionDashboard } from "@/modules/seller/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller dashboard · Aspera Marketplace" };

const priorityTone = {
  critical: "danger",
  action: "warning",
  info: "info",
  completed: "success",
} as const;

export default async function SellerDashboardPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) {
    return (
      <EmptyState
        title="No seller workspace yet"
        description="Complete onboarding and wait for approval, or ask an owner to grant a staff role."
        action={
          <Link href="/seller/onboarding" className="text-sm font-medium text-accent underline">
            Seller onboarding
          </Link>
        }
      />
    );
  }

  const dash = await getSellerActionDashboard(actor, seller.id);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Action centre
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {dash.tradeName ?? dash.legalName}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone={dash.kycStatus === "approved" ? "success" : "warning"}>
            KYC: {dash.kycStatus}
          </Badge>
          {dash.gstinMasked ? (
            <Badge tone="info">GSTIN {dash.gstinMasked}</Badge>
          ) : (
            <Badge tone="warning">GSTIN not on file</Badge>
          )}
          <Badge tone={dash.taxProfileActive ? "success" : "warning"}>
            Tax profile {dash.taxProfileActive ? "active" : "missing"}
          </Badge>
        </div>
        <p className="text-sm text-muted">
          Recent shipped/delivered (7d): {formatPaise(dash.recentSalesPaise)}. Not
          inventing vanity metrics—empty sections stay empty.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {dash.alerts.map((alert) => (
          <Card key={alert.id} className="p-4">
            <Badge tone={priorityTone[alert.priority]}>{alert.priority}</Badge>
            <h2 className="mt-2 font-semibold">{alert.title}</h2>
            <p className="mt-1 text-sm text-muted">{alert.detail}</p>
            <Link
              href={alert.href}
              className="mt-3 inline-block text-sm font-medium text-accent underline"
            >
              Open
            </Link>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {dash.capabilities.catalogue ? (
            <>
              <Link
                href="/seller/catalogue"
                className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                Add / edit catalogue
              </Link>
              <Link
                href="/seller/catalogue"
                className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
              >
                Manage inventory
              </Link>
            </>
          ) : null}
          {dash.capabilities.fulfilment ? (
            <Link
              href="/seller/fulfilment"
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            >
              View orders
            </Link>
          ) : null}
          <Link
            href="/seller/onboarding"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Complete KYC
          </Link>
          <Link
            href="/seller/compliance"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Tax / compliance
          </Link>
          {dash.capabilities.finance ? (
            <Link
              href="/seller/finance"
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            >
              View payouts
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold">Orders awaiting action</h2>
          {dash.awaitingFulfilment.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No fulfilment groups need action.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {dash.awaitingFulfilment.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 border-b border-border py-2">
                  <span>
                    {row.orderNumber} · {row.status}
                  </span>
                  <span>{formatPaise(row.lineTotalPaise)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold">Late fulfilment</h2>
          {dash.lateFulfilment.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing late beyond 24 hours.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {dash.lateFulfilment.map((row) => (
                <li key={row.id} className="border-b border-border py-2">
                  {row.orderNumber} · {row.status} · {row.ageHours}h
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold">Low stock</h2>
          {dash.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No SKUs at or below threshold.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {dash.lowStock.map((row) => (
                <li key={row.inventoryItemId} className="border-b border-border py-2">
                  {row.productTitle} ({row.sku}) · avail {row.available}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold">Returns & catalogue attention</h2>
          {dash.openReturns.length === 0 && dash.draftProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No open returns or draft listings.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {dash.openReturns.map((row) => (
                <li key={row.id} className="border-b border-border py-2">
                  Return {row.orderNumber} · {row.status}
                </li>
              ))}
              {dash.draftProducts.map((row) => (
                <li key={row.id} className="border-b border-border py-2">
                  {row.title} · {row.status}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold">Next settlement</h2>
        {dash.nextSettlement ? (
          <p className="mt-2 text-sm">
            {dash.nextSettlement.batchNumber} · {dash.nextSettlement.status} ·{" "}
            {dash.nextSettlement.netFormatted} · period ends{" "}
            {new Date(dash.nextSettlement.periodEnd).toLocaleDateString("en-IN")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No pending or held settlement batch for this seller.
          </p>
        )}
      </Card>
    </div>
  );
}
