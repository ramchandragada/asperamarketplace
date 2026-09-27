import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { EVENT_TAXONOMY } from "@/modules/analytics/schema";
import {
  listExperiments,
  platformDashboard,
} from "@/modules/analytics/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · Aspera Marketplace" };

export default async function AdminAnalyticsPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");
  if (!actorIsAdmin(actor)) redirect("/account");

  const [dashboard, experiments] = await Promise.all([
    platformDashboard(actor),
    listExperiments(actor),
  ]);
  const maxEvent = Math.max(1, ...dashboard.eventCounts.map((e) => e.count));

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-muted">
          Last {dashboard.windowDays} days of tracked events, search queries,
          and order health. Charts are CSS bars (no chart vendor yet).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Catalogue health</h2>
        <p className="mt-2 text-sm text-muted">
          Approved sellers {dashboard.approvedSellers} · Approved products{" "}
          {dashboard.approvedProducts}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Event counts</h2>
        {dashboard.eventCounts.length === 0 ? (
          <p className="text-sm text-muted">
            No events yet. Clients can POST `/api/analytics/events`.
          </p>
        ) : (
          dashboard.eventCounts.map((row) => (
            <div key={row.eventName} className="text-sm">
              <div className="flex justify-between">
                <span>{row.eventName}</span>
                <span>{row.count}</span>
              </div>
              <div className="mt-1 h-2 w-full bg-black/5">
                <div
                  className="h-2 bg-black/60"
                  style={{ width: `${(row.count / maxEvent) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Top searches</h2>
        <ul className="mt-2 text-sm">
          {dashboard.topSearches.map((row) => (
            <li key={row.query}>
              {row.query} · {row.count}
            </li>
          ))}
          {dashboard.topSearches.length === 0 ? (
            <li className="text-muted">No search events yet.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Orders by status</h2>
        <ul className="mt-2 text-sm">
          {dashboard.ordersByStatus.map((row) => (
            <li key={row.status}>
              {row.status}: {row.count} · {formatPaise(row.totalPaise)}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Event taxonomy</h2>
        <ul className="mt-2 text-sm text-muted">
          {EVENT_TAXONOMY.map((item) => (
            <li key={item.name}>
              <span className="text-foreground">{item.name}</span> —{" "}
              {item.description}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Experiments</h2>
        <ul className="mt-2 text-sm">
          {experiments.map((exp) => (
            <li key={exp.id}>
              {exp.key} · {exp.status} · {exp.name}
            </li>
          ))}
          {experiments.length === 0 ? (
            <li className="text-muted">
              Create via POST `/api/analytics/dashboard`.
            </li>
          ) : null}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/admin/trust" className="underline">
          Trust
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </main>
  );
}
