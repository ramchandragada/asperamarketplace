import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AreaChart,
  AttentionList,
  DashboardCard,
  QuickAction,
  StatTile,
  Trend,
  type AttentionItem,
} from "@/components/dashboard/dashboard-kit";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import {
  getSellerActionDashboard,
  type ActionPriority,
} from "@/modules/seller/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller dashboard" };

const severityFor: Record<
  Exclude<ActionPriority, "completed">,
  AttentionItem["severity"]
> = {
  critical: "critical",
  action: "warning",
  info: "info",
};

const ctaLabelFor: Record<string, string> = {
  late: "Ship now",
  returns: "Review",
  oos: "Restock",
  stock: "Restock",
  drafts: "Open catalogue",
  kyc: "Complete",
  tax: "Open",
};

const statusTone: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  processing: "bg-accent-soft text-accent",
  shipped: "bg-info-soft text-info",
  delivered: "bg-success-soft text-success",
};

function RupeeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 5h10M7 9h10M7 5c6 0 7 8 0 8h3l5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 11H7L6 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 7l12-3 1 3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="16.5" cy="13" r="1.3" fill="currentColor" />
    </svg>
  );
}

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
  const name = dash.tradeName ?? dash.legalName;
  const m = dash.metrics;

  const attentionItems: AttentionItem[] = dash.alerts
    .filter((a) => a.priority !== "completed")
    .map((a) => ({
      id: a.id,
      severity: severityFor[a.priority as Exclude<ActionPriority, "completed">],
      title: a.title,
      detail: a.detail,
      cta: { label: ctaLabelFor[a.id] ?? "Open", href: a.href },
    }));

  const allClearParts: string[] = [];
  if (dash.kycStatus === "approved") allClearParts.push("KYC approved");
  if (dash.taxProfileActive) allClearParts.push("Tax profile active");
  const allClear = allClearParts.length ? allClearParts.join(" · ") : undefined;

  const chartData = m.dailySales.map((d) => ({
    label: d.label,
    value: d.paise / 100,
  }));
  const lowStockRows = [...dash.outOfStock, ...dash.lowStock].slice(0, 6);
  const isNewSeller =
    m.orders30d === 0 &&
    dash.awaitingFulfilment.length === 0 &&
    dash.recentSalesPaise === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            Dashboard
          </p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">
            Welcome back, {name}
          </h1>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              KYC {dash.kycStatus}
            </span>
            {dash.gstinMasked ? (
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-accent">
                GSTIN {dash.gstinMasked}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-1 text-warning">
                GSTIN not on file
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                dash.taxProfileActive
                  ? "bg-success-soft text-success"
                  : "bg-warning-soft text-warning"
              }`}
            >
              Tax profile {dash.taxProfileActive ? "active" : "missing"}
            </span>
          </div>
        </div>
        <Link
          href={`/shops/${seller.id}`}
          className="rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] hover:border-accent"
        >
          View storefront
        </Link>
      </header>

      {isNewSeller ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-border bg-accent-soft px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-accent">
              Let’s get your first sale
            </p>
            <p className="text-[13px] text-muted">
              Add your products and stock — your sales, orders and payouts will
              show up here as they come in.
            </p>
          </div>
          <Link
            href="/seller/catalogue"
            className="rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Add products
          </Link>
        </div>
      ) : null}

      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Sales (30d)"
          value={formatPaise(m.sales30dPaise)}
          icon={<RupeeIcon />}
          trendPct={m.salesTrendPct}
          trendSuffix="vs prev 30d"
          series={m.dailySales.map((d) => d.paise)}
        />
        <StatTile
          label="Orders (30d)"
          value={String(m.orders30d)}
          icon={<BagIcon />}
          trendPct={m.ordersTrendPct}
          trendSuffix="vs prev 30d"
        />
        <StatTile
          label="Awaiting fulfilment"
          value={String(dash.awaitingFulfilment.length)}
          icon={<TruckIcon />}
          flag={
            dash.lateFulfilment.length > 0
              ? {
                  text: `${dash.lateFulfilment.length} late (>24h)`,
                  tone: "danger",
                }
              : null
          }
          footnote={dash.lateFulfilment.length === 0 ? "On track" : undefined}
        />
        <StatTile
          label="Payout due"
          value={formatPaise(m.payoutDuePaise)}
          icon={<WalletIcon />}
          footnote={
            dash.nextSettlement
              ? `Next: ${dash.nextSettlement.batchNumber} · ${dash.nextSettlement.status}`
              : "No pending batch"
          }
        />
      </section>

      {/* Chart + attention */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <DashboardCard
          title="Revenue"
          action={
            dash.capabilities.finance
              ? { label: "Open analytics", href: "/seller/analytics" }
              : undefined
          }
        >
          <div className="flex items-baseline gap-3">
            <span className="text-[24px] font-bold tracking-tight">
              {formatPaise(m.sales30dPaise)}
            </span>
            <span className="text-[12.5px] text-muted">
              last 30 days · <Trend pct={m.salesTrendPct} />
            </span>
          </div>
          <div className="mt-3">
            <AreaChart data={chartData} />
          </div>
        </DashboardCard>

        <DashboardCard
          title="Needs attention"
          aside={`${attentionItems.length} open`}
        >
          <AttentionList items={attentionItems} allClear={allClear} />
        </DashboardCard>
      </section>

      {/* Orders to fulfil */}
      <DashboardCard
        title="Orders to fulfil"
        action={{ label: "View all orders", href: "/seller/fulfilment" }}
      >
        {dash.awaitingFulfilment.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            Nothing waiting — all caught up on fulfilment.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {dash.awaitingFulfilment.slice(0, 6).map((row) => (
                <tr key={row.id} className="border-t border-border text-[13px]">
                  <td className="py-2.5 font-semibold">{row.orderNumber}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        statusTone[row.status] ?? "bg-accent-soft text-accent"
                      }`}
                    >
                      ● {row.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold">
                    {formatPaise(row.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardCard>

      {/* Low stock + payouts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardCard
          title="Low & out of stock"
          action={{ label: "Manage inventory", href: "/seller/inventory" }}
        >
          {lowStockRows.length === 0 ? (
            <p className="py-2 text-sm text-muted">
              Stock levels look healthy.
            </p>
          ) : (
            <ul className="text-[13px]">
              {lowStockRows.map((row) => (
                <li
                  key={row.inventoryItemId}
                  className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
                >
                  <span className="min-w-0 truncate">
                    {row.productTitle}{" "}
                    <span className="text-muted">({row.sku})</span>
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${
                      row.available === 0 ? "text-danger" : "text-warning"
                    }`}
                  >
                    {row.available === 0 ? "Out" : `${row.available} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard
          title="Payouts"
          action={
            dash.capabilities.finance
              ? { label: "View payouts", href: "/seller/finance" }
              : undefined
          }
        >
          <div className="text-[24px] font-bold tracking-tight">
            {formatPaise(m.payoutDuePaise)}
          </div>
          <p className="mt-1 text-[12.5px] text-muted">
            {dash.nextSettlement
              ? `Next batch ${dash.nextSettlement.batchNumber} · ${dash.nextSettlement.status} · period ends ${new Date(
                  dash.nextSettlement.periodEnd,
                ).toLocaleDateString("en-IN")}`
              : "No pending or held settlement batch yet."}
          </p>
          <p className="mt-3 text-[12px] text-muted">
            Payouts are net of 10% platform commission and 0.5% TCS.
          </p>
        </DashboardCard>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-2.5 text-[15px] font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-2.5">
          {dash.capabilities.catalogue ? (
            <>
              <QuickAction href="/seller/catalogue" label="Add / edit catalogue" primary />
              <QuickAction href="/seller/inventory" label="Manage inventory" />
            </>
          ) : null}
          {dash.capabilities.fulfilment ? (
            <QuickAction href="/seller/fulfilment" label="View orders" />
          ) : null}
          <QuickAction href="/seller/compliance" label="Tax / compliance" />
          {dash.capabilities.finance ? (
            <QuickAction href="/seller/finance" label="View payouts" />
          ) : null}
        </div>
      </section>
    </div>
  );
}
