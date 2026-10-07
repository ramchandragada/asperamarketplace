import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAdminHomeDashboard } from "@/modules/admin/dashboard";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const actor = await getOptionalActor();
  // Layout already gates admin; actor is non-null here.
  const dash = await getAdminHomeDashboard(actor!);

  const queues = [
    {
      title: "Seller approvals",
      count: dash.sellersPending,
      detail: "Submitted or under review",
      href: "/admin/sellers",
    },
    {
      title: "Product moderation",
      count: dash.productsPending,
      detail: "Submitted listings waiting review",
      href: "/admin/products",
    },
    {
      title: "Trust & safety",
      count: dash.openRisk + dash.openCounterfeit + dash.pendingReviews,
      detail: `${dash.openRisk} risk · ${dash.openCounterfeit} counterfeit · ${dash.pendingReviews} reviews`,
      href: "/admin/trust",
    },
    {
      title: "Privacy requests",
      count: dash.openPrivacy,
      detail: "Received or in progress",
      href: "/admin/trust",
    },
    {
      title: "Audit activity",
      count: dash.recentAuditCount,
      detail: "Privileged actions in the last 7 days",
      href: "/admin/audit",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Admin overview
        </h1>
        <p className="mt-2 text-muted">
          Queue counts for seller, catalogue, and trust work.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {queues.map((item) => (
          <Card key={item.href + item.title} className="p-4">
            <p className="text-3xl font-semibold tabular-nums">{item.count}</p>
            <h2 className="mt-2 font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-muted">{item.detail}</p>
            <Link
              href={item.href}
              className="mt-3 inline-block text-sm font-medium text-accent underline"
            >
              Open
            </Link>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Shortcuts</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/finance"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Finance
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Analytics
          </Link>
          <Link
            href="/admin/audit"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Audit log
          </Link>
        </div>
      </section>
    </div>
  );
}
