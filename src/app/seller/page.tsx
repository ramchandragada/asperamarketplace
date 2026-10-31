import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaChart, Trend } from "@/components/dashboard/dashboard-kit";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { getSellerActionDashboard } from "@/modules/seller/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller Central" };

function ageLabel(hours: number) {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function shipByLabel(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const late = d.getTime() < now;
  const label = d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return { label, late };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-warning-soft text-warning",
    processing: "bg-accent-soft text-accent",
    shipped: "bg-info-soft text-info",
    delivered: "bg-success-soft text-success",
    requested: "bg-warning-soft text-warning",
    approved: "bg-accent-soft text-accent",
    draft: "bg-accent-soft text-muted",
    submitted: "bg-info-soft text-info",
    rejected: "bg-danger-soft text-danger",
  };
  return map[status] ?? "bg-accent-soft text-accent";
}

function healthTone(rating: "healthy" | "at_risk" | "critical") {
  if (rating === "healthy") return "text-success bg-success-soft";
  if (rating === "at_risk") return "text-warning bg-warning-soft";
  return "text-danger bg-danger-soft";
}

function healthLabel(rating: "healthy" | "at_risk" | "critical") {
  if (rating === "healthy") return "Healthy";
  if (rating === "at_risk") return "At risk";
  return "Critical";
}

function metricOk(value: number, max: number) {
  return value <= max;
}

export default async function SellerDashboardPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login?next=%2Fseller");

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) redirect("/sell");

  const dash = await getSellerActionDashboard(actor, seller.id);
  const name = dash.tradeName ?? dash.legalName;
  const m = dash.metrics;
  const cat = dash.catalogue;
  const health = dash.accountHealth;

  const openAlerts = dash.alerts.filter((a) => a.priority !== "completed");
  const criticalCount = openAlerts.filter((a) => a.priority === "critical").length;
  const toShip = dash.awaitingFulfilment.length;
  const late = dash.lateFulfilment.length;
  const returnsOpen = dash.openReturns.length;
  const oos = dash.outOfStock.length;
  const low = dash.lowStock.length;

  const chartData = m.dailySales.map((d) => ({
    label: d.label,
    value: d.paise / 100,
  }));

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isNewSeller =
    m.orders30d === 0 && toShip === 0 && dash.recentSalesPaise === 0 && cat.live === 0;

  const workQueues = [
    {
      id: "ship",
      label: "To ship",
      count: toShip,
      href: "/seller/fulfilment",
      tone: late > 0 ? "danger" : toShip > 0 ? "warning" : "ok",
      sub: late > 0 ? `${late} past SLA` : "Within 24h SLA",
    },
    {
      id: "returns",
      label: "Returns",
      count: returnsOpen,
      href: "/seller/returns",
      tone: returnsOpen > 0 ? "warning" : "ok",
      sub: returnsOpen > 0 ? "Need decision" : "Queue clear",
    },
    {
      id: "oos",
      label: "Out of stock",
      count: oos,
      href: "/seller/inventory?filter=out_of_stock",
      tone: oos > 0 ? "danger" : "ok",
      sub: low > 0 ? `${low} low stock` : "Stock healthy",
    },
    {
      id: "listings",
      label: "Listings",
      count: cat.live,
      href: "/seller/catalogue",
      tone: cat.live === 0 ? "warning" : "ok",
      sub:
        cat.submitted > 0
          ? `${cat.submitted} in review`
          : cat.draft > 0
            ? `${cat.draft} drafts`
            : `${cat.inStockSkus}/${cat.totalSkus} SKUs in stock`,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Seller Central command bar */}
      <header className="border border-border bg-surface px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
              <span>Seller Central</span>
              <span aria-hidden className="text-border">
                |
              </span>
              <span className="normal-case tracking-normal font-medium">
                {todayLabel}
              </span>
            </div>
            <h1 className="mt-1 truncate font-display text-[22px] leading-tight font-semibold tracking-tight sm:text-[26px]">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
              <span
                className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-semibold ${healthTone(health.rating)}`}
              >
                Account health · {healthLabel(health.rating)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-medium ${
                  dash.kycStatus === "approved"
                    ? "bg-success-soft text-success"
                    : "bg-warning-soft text-warning"
                }`}
              >
                KYC {dash.kycStatus}
              </span>
              {dash.gstinMasked ? (
                <span className="inline-flex items-center rounded-sm bg-accent-soft px-2 py-1 font-medium text-foreground">
                  GSTIN {dash.gstinMasked}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-sm bg-warning-soft px-2 py-1 font-medium text-warning">
                  Add GSTIN
                </span>
              )}
              {criticalCount > 0 ? (
                <span className="inline-flex items-center rounded-sm bg-danger-soft px-2 py-1 font-semibold text-danger">
                  {criticalCount} critical
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dash.capabilities.fulfilment ? (
              <Link
                href="/seller/fulfilment"
                className="inline-flex min-h-10 items-center bg-accent px-3.5 text-sm font-semibold text-accent-foreground"
              >
                Manage orders
                {toShip > 0 ? ` · ${toShip}` : ""}
              </Link>
            ) : null}
            {dash.capabilities.catalogue ? (
              <Link
                href="/seller/catalogue"
                className="inline-flex min-h-10 items-center border border-border bg-background px-3.5 text-sm font-semibold"
              >
                Add product
              </Link>
            ) : null}
            <Link
              href={`/shops/${seller.id}`}
              className="inline-flex min-h-10 items-center border border-border bg-background px-3.5 text-sm font-semibold text-muted hover:text-foreground"
            >
              View shop
            </Link>
          </div>
        </div>

        {/* Business snapshot strip */}
        <dl className="mt-3.5 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Sales · 30d", formatPaise(m.sales30dPaise), <Trend key="s" pct={m.salesTrendPct} />],
              ["Orders · 30d", String(m.orders30d), <Trend key="o" pct={m.ordersTrendPct} />],
              ["Units · 30d", String(m.units30d), null],
              ["Shipped today", String(m.shippedToday), null],
              ["Payout due", formatPaise(m.payoutDuePaise), null],
              [
                "AOV · 30d",
                m.orders30d > 0
                  ? formatPaise(Math.round(m.sales30dPaise / m.orders30d))
                  : "—",
                null,
              ],
            ] as const
          ).map(([label, value, trend]) => (
            <div key={label} className="bg-surface px-3 py-2.5">
              <dt className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                {label}
              </dt>
              <dd className="mt-0.5 flex flex-wrap items-baseline gap-2">
                <span className="text-[17px] font-bold tracking-tight">{value}</span>
                {trend}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {isNewSeller ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-accent/25 bg-accent-soft px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Launch checklist — get your first sale
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              Approve KYC, add live listings, set stock, then clear the ship queue.
            </p>
          </div>
          <Link
            href="/seller/catalogue"
            className="bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Add products
          </Link>
        </div>
      ) : null}

      {/* Today’s work queues */}
      <section aria-label="Today work queues">
        <div className="mb-2 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-semibold">Today’s work</h2>
            <p className="text-[12px] text-muted">
              Ship on SLA, clear returns, keep catalogue sellable
            </p>
          </div>
          {openAlerts.length > 0 ? (
            <span className="text-[12px] font-semibold text-muted">
              {openAlerts.length} open action
              {openAlerts.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {workQueues.map((q) => (
            <Link
              key={q.id}
              href={q.href}
              className="border border-border bg-surface px-3.5 py-3 transition hover:border-foreground/30"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {q.label}
                </p>
                <span
                  className={`text-[22px] font-bold tracking-tight ${
                    q.tone === "danger"
                      ? "text-danger"
                      : q.tone === "warning"
                        ? "text-warning"
                        : "text-foreground"
                  }`}
                >
                  {q.count}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted">{q.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Orders table (primary) + account health / returns */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.9fr)]">
        <section className="border border-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-[15px] font-semibold">Orders to fulfil</h2>
              <p className="text-[12px] text-muted">
                Ship-by = order create + 24h · process oldest first
              </p>
            </div>
            <Link
              href="/seller/fulfilment"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Open order desk →
            </Link>
          </div>
          {dash.awaitingFulfilment.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted sm:px-5">
              No open fulfilment groups. You’re caught up.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-accent-soft/50 text-[10.5px] tracking-wide text-muted uppercase">
                    <th className="px-4 py-2.5 font-semibold sm:px-5">Order</th>
                    <th className="px-2 py-2.5 font-semibold">Items</th>
                    <th className="px-2 py-2.5 font-semibold">Ship by</th>
                    <th className="px-2 py-2.5 font-semibold">Ship to</th>
                    <th className="px-2 py-2.5 font-semibold">Status</th>
                    <th className="px-2 py-2.5 font-semibold">Age</th>
                    <th className="px-4 py-2.5 text-right font-semibold sm:px-5">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dash.awaitingFulfilment.slice(0, 10).map((row) => {
                    const lateRow = row.ageHours >= 24;
                    const ship = shipByLabel(row.shipByAt);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-border/80 text-[13px] last:border-b-0 hover:bg-accent-soft/30"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <Link
                            href="/seller/fulfilment"
                            className="font-semibold hover:underline"
                          >
                            {row.orderNumber}
                          </Link>
                          <p className="mt-0.5 max-w-[14rem] truncate text-[11.5px] text-muted">
                            {row.firstTitle}
                            {row.itemCount > 1 ? ` +${row.itemCount - 1}` : ""}
                          </p>
                        </td>
                        <td className="px-2 py-3 font-medium">{row.itemCount}</td>
                        <td
                          className={`px-2 py-3 font-semibold ${
                            ship.late ? "text-danger" : "text-foreground"
                          }`}
                        >
                          {ship.label}
                          {ship.late ? (
                            <span className="mt-0.5 block text-[10.5px] font-bold uppercase">
                              Late
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-3 text-muted">
                          {row.city}
                          <span className="block text-[11px]">
                            {row.postalCode}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td
                          className={`px-2 py-3 font-semibold ${
                            lateRow ? "text-danger" : "text-muted"
                          }`}
                        >
                          {ageLabel(row.ageHours)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold sm:px-5">
                          {formatPaise(row.lineTotalPaise)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold">Account health</h2>
              <span
                className={`rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase ${healthTone(health.rating)}`}
              >
                {healthLabel(health.rating)}
              </span>
            </div>
            <ul className="divide-y divide-border text-[13px]">
              {(
                [
                  [
                    "Late shipment rate",
                    health.lateShipmentRatePct,
                    health.targets.lateShipmentMaxPct,
                    "Open queue past 24h",
                  ],
                  [
                    "Cancellation rate · 30d",
                    health.cancellationRatePct,
                    health.targets.cancellationMaxPct,
                    `${m.cancelled30d} cancelled groups`,
                  ],
                  [
                    "Open return rate",
                    health.returnRatePct,
                    health.targets.returnMaxPct,
                    "vs delivered · 30d",
                  ],
                  [
                    "OOS SKU rate",
                    health.oosSkuRatePct,
                    health.targets.oosSkuMaxPct,
                    `${oos} of ${cat.totalSkus} SKUs`,
                  ],
                ] as const
              ).map(([label, value, max, hint]) => {
                const ok = metricOk(value, max);
                return (
                  <li
                    key={label}
                    className="flex items-start justify-between gap-3 px-4 py-2.5"
                  >
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-[11.5px] text-muted">{hint}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${ok ? "text-success" : "text-danger"}`}
                      >
                        {value}%
                      </p>
                      <p className="text-[10.5px] text-muted">target ≤{max}%</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-[15px] font-semibold">Returns queue</h2>
              <Link
                href="/seller/returns"
                className="text-[12.5px] font-semibold text-accent hover:underline"
              >
                All →
              </Link>
            </div>
            {dash.openReturns.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                No open returns.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {dash.openReturns.slice(0, 5).map((row) => (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-3 px-4 py-2.5 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{row.orderNumber}</p>
                      <p className="truncate text-[12px] text-muted">
                        {row.reason}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      {/* Priority actions */}
      {openAlerts.length > 0 ? (
        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-[15px] font-semibold">Priority actions</h2>
              <p className="text-[12px] text-muted">
                Clear critical items before they hit account health
              </p>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {openAlerts.slice(0, 6).map((alert) => {
              const tone =
                alert.priority === "critical"
                  ? "border-l-danger"
                  : alert.priority === "action"
                    ? "border-l-warning"
                    : "border-l-accent";
              return (
                <li
                  key={alert.id}
                  className={`flex flex-wrap items-center justify-between gap-3 border-l-4 px-4 py-3 sm:px-5 ${tone}`}
                >
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase">
                      {alert.priority}
                    </p>
                    <p className="mt-0.5 text-[14px] font-semibold">
                      {alert.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {alert.detail}
                    </p>
                  </div>
                  <Link
                    href={alert.href}
                    className="shrink-0 border border-border bg-background px-3 py-2 text-[12.5px] font-semibold hover:border-foreground/30"
                  >
                    Resolve →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Catalogue / inventory / payouts / top products */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <section className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Catalogue</h2>
            <Link
              href="/seller/catalogue"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Manage →
            </Link>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {(
              [
                ["Live", cat.live, "text-success"],
                ["In review", cat.submitted, "text-info"],
                ["Drafts", cat.draft, "text-muted"],
                ["Rejected", cat.rejected, "text-danger"],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label} className="border border-border bg-background px-2.5 py-2">
                <dt className="text-[10.5px] font-semibold text-muted uppercase">
                  {label}
                </dt>
                <dd className={`mt-0.5 text-lg font-bold ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold">Inventory risk</h2>
            <Link
              href="/seller/inventory"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Stock →
            </Link>
          </div>
          {[...dash.outOfStock, ...dash.lowStock].length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Stock levels look healthy.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {[...dash.outOfStock, ...dash.lowStock].slice(0, 6).map((row) => (
                <li
                  key={row.inventoryItemId}
                  className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{row.productTitle}</span>
                    <span className="text-muted"> · {row.sku}</span>
                  </span>
                  <span
                    className={`shrink-0 text-[12px] font-bold ${
                      row.available === 0 ? "text-danger" : "text-warning"
                    }`}
                  >
                    {row.available === 0 ? "OUT" : `${row.available} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Payouts</h2>
            {dash.capabilities.finance ? (
              <Link
                href="/seller/finance"
                className="text-[12.5px] font-semibold text-accent hover:underline"
              >
                Ledger →
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-[26px] font-bold tracking-tight">
            {formatPaise(m.payoutDuePaise)}
          </p>
          <p className="mt-1 text-[12.5px] text-muted">
            {dash.nextSettlement
              ? `Batch ${dash.nextSettlement.batchNumber} · ${dash.nextSettlement.status} · ends ${new Date(
                  dash.nextSettlement.periodEnd,
                ).toLocaleDateString("en-IN")}`
              : "No pending settlement batch."}
          </p>
          <ul className="mt-3 space-y-1 border border-border bg-background px-3 py-2.5 text-[12px] text-muted">
            <li>Net of 10% platform commission</li>
            <li>TCS withheld at 0.5%</li>
            <li>7d sales {formatPaise(m.sales7dPaise)}</li>
            <li>Delivered today · {m.deliveredToday}</li>
          </ul>
        </section>

        <section className="border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-[15px] font-semibold">Top products · 30d</h2>
            {dash.capabilities.finance ? (
              <Link
                href="/seller/analytics"
                className="text-[12.5px] font-semibold text-accent hover:underline"
              >
                Analytics →
              </Link>
            ) : null}
          </div>
          {dash.topProducts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No shipped sales in the last 30 days.
            </p>
          ) : (
            <ol className="divide-y divide-border">
              {dash.topProducts.map((row, i) => (
                <li
                  key={row.productId}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px]"
                >
                  <span className="w-5 shrink-0 text-[11px] font-bold text-muted">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{row.title}</p>
                    <p className="text-[11.5px] text-muted">
                      {row.units} units
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatPaise(row.salesPaise)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>

      {/* Revenue chart */}
      <section className="border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Revenue · 30 days</h2>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-[24px] font-bold tracking-tight">
                {formatPaise(m.sales30dPaise)}
              </span>
              <span className="text-[12.5px] text-muted">
                <Trend pct={m.salesTrendPct} suffix="vs prior 30d" />
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/seller/inventory"
              className="border border-border px-3 py-2 text-[12.5px] font-semibold hover:border-foreground/30"
            >
              Update stock
            </Link>
            <Link
              href="/seller/compliance"
              className="border border-border px-3 py-2 text-[12.5px] font-semibold hover:border-foreground/30"
            >
              Tax / GST
            </Link>
            <Link
              href="/seller/profile"
              className="border border-border px-3 py-2 text-[12.5px] font-semibold hover:border-foreground/30"
            >
              Store profile
            </Link>
          </div>
        </div>
        <div className="mt-3">
          <AreaChart data={chartData} height={150} />
        </div>
      </section>
    </div>
  );
}
