import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaChart, Trend } from "@/components/dashboard/dashboard-kit";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { getSellerActionDashboard } from "@/modules/seller/dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller dashboard" };

function ageLabel(hours: number) {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
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

export default async function SellerDashboardPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login?next=%2Fseller");

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) redirect("/sell");

  const dash = await getSellerActionDashboard(actor, seller.id);
  const name = dash.tradeName ?? dash.legalName;
  const m = dash.metrics;
  const cat = dash.catalogue;

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

  const pulse = [
    {
      label: "To ship",
      value: String(toShip),
      tone: late > 0 ? "danger" : toShip > 0 ? "warning" : "ok",
      href: "/seller/fulfilment",
      hint: late > 0 ? `${late} late` : "Queue",
    },
    {
      label: "Returns",
      value: String(returnsOpen),
      tone: returnsOpen > 0 ? "warning" : "ok",
      href: "/seller/returns",
      hint: returnsOpen > 0 ? "Need review" : "Clear",
    },
    {
      label: "Live listings",
      value: String(cat.live),
      tone: cat.live === 0 ? "warning" : "ok",
      href: "/seller/catalogue",
      hint:
        cat.submitted > 0
          ? `${cat.submitted} in review`
          : cat.draft > 0
            ? `${cat.draft} drafts`
            : "Approved",
    },
    {
      label: "Out of stock",
      value: String(oos),
      tone: oos > 0 ? "danger" : "ok",
      href: "/seller/inventory?filter=out_of_stock",
      hint: low > 0 ? `${low} low` : "Healthy",
    },
    {
      label: "Payout due",
      value: formatPaise(m.payoutDuePaise),
      tone: "ok",
      href: "/seller/finance",
      hint: dash.nextSettlement
        ? dash.nextSettlement.batchNumber
        : "No batch",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Command header */}
      <header className="rounded-[var(--radius)] border border-border bg-surface px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
              <span>Seller central</span>
              <span aria-hidden>·</span>
              <span className="normal-case tracking-normal text-muted">
                {todayLabel}
              </span>
            </div>
            <h1 className="mt-1 truncate font-display text-[26px] leading-tight font-semibold tracking-tight sm:text-[30px]">
              {name}
            </h1>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-medium">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  dash.kycStatus === "approved"
                    ? "bg-success-soft text-success"
                    : "bg-warning-soft text-warning"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    dash.kycStatus === "approved" ? "bg-success" : "bg-warning"
                  }`}
                />
                KYC {dash.kycStatus}
              </span>
              {dash.gstinMasked ? (
                <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-1 text-foreground">
                  GSTIN {dash.gstinMasked}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-1 text-warning">
                  Add GSTIN
                </span>
              )}
              {criticalCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-danger-soft px-2.5 py-1 text-danger">
                  {criticalCount} critical
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-1 text-success">
                  Ops clear
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {dash.capabilities.fulfilment ? (
              <Link
                href="/seller/fulfilment"
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-accent px-4 text-sm font-semibold text-accent-foreground"
              >
                Process orders
                {toShip > 0 ? ` (${toShip})` : ""}
              </Link>
            ) : null}
            {dash.capabilities.catalogue ? (
              <Link
                href="/seller/catalogue"
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-border bg-background px-4 text-sm font-semibold"
              >
                Add listing
              </Link>
            ) : null}
            <Link
              href={`/shops/${seller.id}`}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-border bg-background px-4 text-sm font-semibold text-muted hover:text-foreground"
            >
              Storefront
            </Link>
          </div>
        </div>
      </header>

      {isNewSeller ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-accent/20 bg-accent-soft px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Launch checklist — get your first sale
            </p>
            <p className="mt-0.5 text-[13px] text-muted">
              Add approved listings, set stock, then watch orders and payouts
              land here.
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

      {/* Today’s ops pulse */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {pulse.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-[var(--radius)] border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] transition hover:border-foreground/25"
          >
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              {item.label}
            </p>
            <p
              className={`mt-1.5 text-[22px] font-bold tracking-tight ${
                item.tone === "danger"
                  ? "text-danger"
                  : item.tone === "warning"
                    ? "text-warning"
                    : "text-foreground"
              }`}
            >
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-muted">{item.hint}</p>
          </Link>
        ))}
      </section>

      {/* Priority queue + fulfilment */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.15fr]">
        <section className="rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-[15px] font-semibold">Priority queue</h2>
              <p className="text-[12px] text-muted">
                Ship, restock, and clear returns first
              </p>
            </div>
            <span className="text-xs font-semibold text-muted">
              {openAlerts.length} open
            </span>
          </div>
          {openAlerts.length === 0 ? (
            <div className="m-4 rounded-[var(--radius-sm)] bg-success-soft px-3 py-3 text-[13px] font-semibold text-success sm:m-5">
              ✓ Nothing blocking sales — KYC and tax look good.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {openAlerts.map((alert) => {
                const tone =
                  alert.priority === "critical"
                    ? "border-l-danger bg-danger-soft/40"
                    : alert.priority === "action"
                      ? "border-l-warning bg-warning-soft/35"
                      : "border-l-accent bg-accent-soft/40";
                const cta =
                  alert.id === "late" || alert.id === "returns"
                    ? "Review"
                    : alert.id === "oos" || alert.id === "stock"
                      ? "Restock"
                      : alert.id === "drafts"
                        ? "Open catalogue"
                        : alert.id === "kyc"
                          ? "Complete"
                          : "Open";
                return (
                  <li
                    key={alert.id}
                    className={`flex flex-wrap items-center justify-between gap-3 border-l-4 px-4 py-3.5 sm:px-5 ${tone}`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold tracking-wide text-muted uppercase">
                        {alert.priority}
                      </p>
                      <p className="mt-0.5 text-[14px] font-semibold text-foreground">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {alert.detail}
                      </p>
                    </div>
                    <Link
                      href={alert.href}
                      className="shrink-0 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-[12.5px] font-semibold hover:border-foreground/30"
                    >
                      {cta} →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-[15px] font-semibold">Orders to fulfil</h2>
              <p className="text-[12px] text-muted">
                SLA clock from order create · ship within 24h
              </p>
            </div>
            <Link
              href="/seller/fulfilment"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              All orders →
            </Link>
          </div>
          {dash.awaitingFulfilment.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted sm:px-5">
              No open fulfilment groups. You’re caught up.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] tracking-wide text-muted uppercase">
                    <th className="px-4 py-2.5 font-medium sm:px-5">Order</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Age</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dash.awaitingFulfilment.slice(0, 8).map((row) => {
                    const lateRow = row.ageHours >= 24;
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-border/80 text-[13px] last:border-b-0"
                      >
                        <td className="px-4 py-3 font-semibold sm:px-5">
                          <Link
                            href="/seller/fulfilment"
                            className="hover:underline"
                          >
                            {row.orderNumber}
                          </Link>
                        </td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(row.status)}`}
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
                          {lateRow ? " · late" : ""}
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
      </section>

      {/* Catalogue health + inventory + payouts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Catalogue health</h2>
            <Link
              href="/seller/catalogue"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Manage →
            </Link>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {(
              [
                ["Live", cat.live, "text-success"],
                ["In review", cat.submitted, "text-info"],
                ["Drafts", cat.draft, "text-muted"],
                ["Rejected", cat.rejected, "text-danger"],
              ] as const
            ).map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2.5"
              >
                <dt className="text-[11px] font-semibold text-muted uppercase">
                  {label}
                </dt>
                <dd className={`mt-1 text-xl font-bold ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[12px] text-muted">
            {cat.inStockSkus}/{cat.totalSkus} SKUs in stock
          </p>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="text-[15px] font-semibold">Inventory risk</h2>
            <Link
              href="/seller/inventory"
              className="text-[12.5px] font-semibold text-accent hover:underline"
            >
              Inventory →
            </Link>
          </div>
          {[...dash.outOfStock, ...dash.lowStock].length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted sm:px-5">
              Stock levels look healthy.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {[...dash.outOfStock, ...dash.lowStock].slice(0, 7).map((row) => (
                <li
                  key={row.inventoryItemId}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] sm:px-5"
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

        <section className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
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
          <p className="mt-4 text-[28px] font-bold tracking-tight">
            {formatPaise(m.payoutDuePaise)}
          </p>
          <p className="mt-1 text-[12.5px] text-muted">
            {dash.nextSettlement
              ? `Batch ${dash.nextSettlement.batchNumber} · ${dash.nextSettlement.status} · period ends ${new Date(
                  dash.nextSettlement.periodEnd,
                ).toLocaleDateString("en-IN")}`
              : "No pending or held settlement yet."}
          </p>
          <div className="mt-4 space-y-2 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-3 text-[12px] text-muted">
            <p>Net of 10% platform commission</p>
            <p>TCS withheld at 0.5%</p>
            <p>7d sales {formatPaise(m.sales7dPaise)}</p>
          </div>
        </section>
      </section>

      {/* Performance */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold">Revenue · 30 days</h2>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="text-[26px] font-bold tracking-tight">
                  {formatPaise(m.sales30dPaise)}
                </span>
                <span className="text-[12.5px] text-muted">
                  <Trend pct={m.salesTrendPct} suffix="vs prior 30d" />
                </span>
              </div>
            </div>
            {dash.capabilities.finance ? (
              <Link
                href="/seller/analytics"
                className="text-[12.5px] font-semibold text-accent hover:underline"
              >
                Analytics →
              </Link>
            ) : null}
          </div>
          <div className="mt-3">
            <AreaChart data={chartData} height={160} />
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
          <h2 className="text-[15px] font-semibold">30-day snapshot</h2>
          <dl className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="text-sm text-muted">Orders</dt>
              <dd className="text-sm font-bold">
                {m.orders30d}{" "}
                <span className="font-medium text-muted">
                  <Trend pct={m.ordersTrendPct} />
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="text-sm text-muted">Avg order value</dt>
              <dd className="text-sm font-bold">
                {m.orders30d > 0
                  ? formatPaise(Math.round(m.sales30dPaise / m.orders30d))
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <dt className="text-sm text-muted">Open returns</dt>
              <dd className="text-sm font-bold">{returnsOpen}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted">Fulfilment backlog</dt>
              <dd
                className={`text-sm font-bold ${late > 0 ? "text-danger" : ""}`}
              >
                {toShip}
                {late > 0 ? ` · ${late} late` : ""}
              </dd>
            </div>
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {dash.capabilities.catalogue ? (
              <Link
                href="/seller/inventory"
                className="rounded-[var(--radius-sm)] border border-border px-3 py-2.5 text-center text-[12.5px] font-semibold hover:border-foreground/30"
              >
                Update stock
              </Link>
            ) : null}
            {dash.capabilities.returns ? (
              <Link
                href="/seller/returns"
                className="rounded-[var(--radius-sm)] border border-border px-3 py-2.5 text-center text-[12.5px] font-semibold hover:border-foreground/30"
              >
                Review returns
              </Link>
            ) : null}
            <Link
              href="/seller/compliance"
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2.5 text-center text-[12.5px] font-semibold hover:border-foreground/30"
            >
              Tax / GST
            </Link>
            <Link
              href="/seller/profile"
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2.5 text-center text-[12.5px] font-semibold hover:border-foreground/30"
            >
              Store profile
            </Link>
          </div>
        </section>
      </section>
    </div>
  );
}
