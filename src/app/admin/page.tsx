import {
  AreaChart,
  AttentionList,
  DashboardCard,
  QuickAction,
  StatTile,
  Trend,
  type AttentionItem,
} from "@/components/dashboard/dashboard-kit";
import { getAdminHomeDashboard } from "@/modules/admin/dashboard";
import { getOptionalActor } from "@/modules/identity/service";
import { formatPaise } from "@/modules/catalogue/helpers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

const statusTone: Record<string, string> = {
  paid: "bg-accent-soft text-accent",
  fulfilled: "bg-success-soft text-success",
  partially_cancelled: "bg-warning-soft text-warning",
};

function ChartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
function UsersIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 19c1-3 3.5-4.5 6-4.5S14 16 15 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 5.5a3 3 0 0 1 0 5M18 19c-.5-2-1.6-3.3-3-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function InboxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16v14H4zM4 13h5a3 3 0 0 0 6 0h5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export default async function AdminHomePage() {
  const actor = await getOptionalActor();
  // Layout already gates admin; actor is non-null here.
  const dash = await getAdminHomeDashboard(actor!);
  const m = dash.metrics;

  const openTasks =
    dash.sellersPending +
    dash.productsPending +
    dash.openRisk +
    dash.openCounterfeit +
    dash.pendingReviews +
    dash.openPrivacy;

  const queues: AttentionItem[] = [];
  if (dash.sellersPending > 0)
    queues.push({
      id: "sellers",
      severity: "warning",
      title: `${dash.sellersPending} seller approval(s)`,
      detail: "Submitted or under review",
      cta: { label: "Review", href: "/admin/sellers" },
    });
  if (dash.productsPending > 0)
    queues.push({
      id: "products",
      severity: "warning",
      title: `${dash.productsPending} product(s) to moderate`,
      detail: "Submitted listings waiting for review",
      cta: { label: "Review", href: "/admin/products" },
    });
  if (dash.openRisk + dash.openCounterfeit > 0)
    queues.push({
      id: "trust",
      severity: "critical",
      title: `${dash.openRisk + dash.openCounterfeit} trust & safety case(s)`,
      detail: `${dash.openRisk} risk · ${dash.openCounterfeit} counterfeit`,
      cta: { label: "Open", href: "/admin/trust" },
    });
  if (dash.pendingReviews > 0)
    queues.push({
      id: "reviews",
      severity: "warning",
      title: `${dash.pendingReviews} review(s) to moderate`,
      detail: "Customer reviews pending approval",
      cta: { label: "Moderate", href: "/admin/trust" },
    });
  if (dash.openPrivacy > 0)
    queues.push({
      id: "privacy",
      severity: "warning",
      title: `${dash.openPrivacy} privacy request(s)`,
      detail: "Received or in progress",
      cta: { label: "Handle", href: "/admin/trust" },
    });

  const chartData = m.dailyGmv.map((d) => ({
    label: d.label,
    value: d.paise / 100,
  }));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          Operations
        </p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight">
          Admin overview
        </h1>
      </header>

      {/* KPI row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="GMV (30d)"
          value={formatPaise(m.gmv30dPaise)}
          icon={<ChartIcon />}
          trendPct={m.gmvTrendPct}
          trendSuffix="vs prev 30d"
          series={m.dailyGmv.map((d) => d.paise)}
        />
        <StatTile
          label="Orders (30d)"
          value={String(m.orders30d)}
          icon={<BagIcon />}
          trendPct={m.ordersTrendPct}
          trendSuffix="vs prev 30d"
        />
        <StatTile
          label="Active sellers"
          value={String(m.activeSellers)}
          icon={<UsersIcon />}
          footnote="Approved"
        />
        <StatTile
          label="Open tasks"
          value={String(openTasks)}
          icon={<InboxIcon />}
          flag={
            openTasks > 0
              ? { text: "Awaiting action", tone: "warning" }
              : null
          }
          footnote={openTasks === 0 ? "All clear" : undefined}
        />
      </section>

      {/* GMV chart + work queues */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <DashboardCard
          title="Platform GMV"
          action={{ label: "Open analytics", href: "/admin/analytics" }}
        >
          <div className="flex items-baseline gap-3">
            <span className="text-[24px] font-bold tracking-tight">
              {formatPaise(m.gmv30dPaise)}
            </span>
            <span className="text-[12.5px] text-muted">
              last 30 days · <Trend pct={m.gmvTrendPct} />
            </span>
          </div>
          <div className="mt-3">
            <AreaChart data={chartData} />
          </div>
        </DashboardCard>

        <DashboardCard title="Work queues" aside={`${queues.length} open`}>
          <AttentionList
            items={queues}
            allClear="No open queues — nothing awaiting review."
          />
        </DashboardCard>
      </section>

      {/* Recent orders */}
      <DashboardCard
        title="Recent orders"
        action={{ label: "View all orders", href: "/admin/orders" }}
      >
        {dash.recentOrders.length === 0 ? (
          <p className="py-2 text-sm text-muted">No paid orders yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Amount</th>
                <th className="py-2 text-right font-medium">Placed</th>
              </tr>
            </thead>
            <tbody>
              {dash.recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border text-[13px]">
                  <td className="py-2.5 font-semibold">{o.orderNumber}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        statusTone[o.status] ?? "bg-accent-soft text-accent"
                      }`}
                    >
                      ● {o.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold">
                    {formatPaise(o.totalPaise)}
                  </td>
                  <td className="py-2.5 text-right text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardCard>

      {/* Shortcuts */}
      <section>
        <h2 className="mb-2.5 text-[15px] font-semibold">Shortcuts</h2>
        <div className="flex flex-wrap gap-2.5">
          <QuickAction href="/admin/sellers" label="Sellers" primary />
          <QuickAction href="/admin/products" label="Products" />
          <QuickAction href="/admin/orders" label="Orders" />
          <QuickAction href="/admin/trust" label="Trust & safety" />
          <QuickAction href="/admin/finance" label="Finance" />
          <QuickAction href="/admin/analytics" label="Analytics" />
          <QuickAction href="/admin/audit" label="Audit log" />
        </div>
      </section>
    </div>
  );
}
