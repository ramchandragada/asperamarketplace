import { DataQualityCleanupButton } from "@/components/data-quality-cleanup-button";
import { getOptionalActor } from "@/modules/identity/service";
import { buildCatalogueDataQualityReport } from "@/modules/admin/data-quality";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data quality" };

export default async function AdminDataQualityPage() {
  const actor = await getOptionalActor();
  const report = await buildCatalogueDataQualityReport(actor!);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Catalogue data quality</h1>
          <p className="mt-2 text-muted">
            Flags duplicate titles per seller, placeholder images, and demo
            contact / copy strings.
          </p>
        </div>
        <DataQualityCleanupButton />
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Products", report.summary.productCount],
            ["Sellers", report.summary.sellerCount],
            ["Images", report.summary.imageCount],
            ["Issues", report.summary.issueCount],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-[var(--radius)] border border-border bg-surface p-4"
          >
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
              {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm">
        <p className="font-semibold">By kind</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {Object.entries(report.summary.byKind).map(([kind, count]) => (
            <li key={kind} className="flex justify-between gap-4">
              <span className="text-muted">{kind.replaceAll("_", " ")}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
        </ul>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Issues</h2>
        {report.issues.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No issues detected.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {report.issues.map((issue) => (
              <li
                key={`${issue.kind}-${issue.entityId}-${issue.detail.slice(0, 24)}`}
                className="rounded-[var(--radius)] border border-border bg-surface p-3 text-sm"
              >
                <p className="font-medium">
                  <span className="uppercase tracking-wide text-xs text-accent">
                    {issue.severity}
                  </span>{" "}
                  · {issue.kind.replaceAll("_", " ")} · {issue.entityType}
                </p>
                <p className="mt-1">{issue.label}</p>
                <p className="mt-1 text-muted">{issue.detail}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {issue.entityId}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
