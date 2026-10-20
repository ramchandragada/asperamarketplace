import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/ui/page-shell";
import { buildSpendReport } from "@/modules/account/service";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spend analytics" };

export default async function AccountSpendPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/account/spend");
  }
  const report = await buildSpendReport(actor);

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Business analytics
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Spend report
          </h1>
          <p className="mt-2 text-muted">
            Download order lines by date and seller for your books.
          </p>
        </div>
        <a
          href="/api/account/spend?format=csv"
          className="rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Download CSV
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <p className="text-sm text-muted">Orders</p>
          <p className="mt-1 text-2xl font-semibold">
            {report.summary.orderCount}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <p className="text-sm text-muted">Line items</p>
          <p className="mt-1 text-2xl font-semibold">
            {report.summary.lineCount}
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <p className="text-sm text-muted">Total spend</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatPaise(report.summary.totalSpendPaise)}
          </p>
        </div>
      </div>

      {report.summary.bySeller.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">By seller</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {report.summary.bySeller.map((entry) => (
              <li
                key={entry.seller}
                className="flex justify-between gap-4 border-b border-border py-2"
              >
                <span>{entry.seller}</span>
                <span className="font-medium">
                  {formatPaise(entry.merchandisePaise)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report.rows.length === 0 ? (
        <p className="text-sm text-muted">
          No paid orders yet.{" "}
          <Link href="/shop" className="underline">
            Start shopping
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-accent-soft/40 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Seller</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Line</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.slice(0, 40).map((row, index) => (
                <tr
                  key={`${row.orderNumber}-${row.productTitle}-${index}`}
                  className="border-t border-border"
                >
                  <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {row.orderNumber}
                  </td>
                  <td className="px-3 py-2">{row.seller}</td>
                  <td className="px-3 py-2">{row.productTitle}</td>
                  <td className="px-3 py-2">{row.quantity}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatPaise(row.lineTotalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.rows.length > 40 ? (
            <p className="border-t border-border px-3 py-2 text-xs text-muted">
              Showing first 40 lines. Download CSV for the full export.
            </p>
          ) : null}
        </div>
      )}

      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </PageShell>
  );
}
