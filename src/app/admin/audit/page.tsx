import Link from "next/link";
import { listAuditLogs } from "@/modules/admin/audit";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

function buildHref(next: {
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (next.action) params.set("action", next.action);
  if (next.actorId) params.set("actorId", next.actorId);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const action = params.action?.trim() || undefined;
  const actorId = params.actorId?.trim() || undefined;
  const from = params.from?.trim() || undefined;
  const to = params.to?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = Math.min(
    Math.max(Number(params.pageSize ?? "25") || 25, 1),
    100,
  );

  const result = await listAuditLogs(actor!, {
    action,
    actorId,
    from,
    to,
    page,
    pageSize,
  });

  const hrefFor = (overrides: {
    action?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
  }) =>
    buildHref({
      action: overrides.action !== undefined ? overrides.action : action,
      actorId: overrides.actorId !== undefined ? overrides.actorId : actorId,
      from: overrides.from !== undefined ? overrides.from : from,
      to: overrides.to !== undefined ? overrides.to : to,
      page: overrides.page ?? page,
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit log</h1>
        <p className="mt-2 text-muted">
          Privileged actions (cart noise excluded by default). Newest first.
        </p>
        <form className="mt-4 flex flex-wrap items-end gap-2" method="get">
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-sm">
            <span className="text-muted">Action</span>
            <select
              name="action"
              defaultValue={action ?? ""}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            >
              <option value="">All privileged (excl. cart.*)</option>
              {result.actions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
            <span className="text-muted">Actor ID</span>
            <input
              name="actorId"
              defaultValue={actorId ?? ""}
              placeholder="UUID"
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-muted">From</span>
            <input
              type="date"
              name="from"
              defaultValue={from ?? ""}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            />
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-muted">To</span>
            <input
              type="date"
              name="to"
              defaultValue={to ?? ""}
              className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          >
            Filter
          </button>
          <Link
            href="/admin/audit"
            className="rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          >
            Reset
          </Link>
        </form>
      </div>

      <p className="text-sm text-muted">
        {result.total} event{result.total === 1 ? "" : "s"} · page {result.page}{" "}
        of {result.pageCount}
      </p>

      {result.items.length === 0 ? (
        <p className="text-sm text-muted">No audit rows match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr key={row.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted">
                    {new Date(row.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-2 font-medium">{row.action}</td>
                  <td className="px-3 py-2">
                    <span>{row.targetType}</span>
                    {row.targetId ? (
                      <p className="font-mono text-xs text-muted">
                        {row.targetId.slice(0, 8)}…
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {row.actorId ? `${row.actorId.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {row.reason ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={hrefFor({ page: Math.max(1, result.page - 1) })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            result.page <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor({
            page: Math.min(result.pageCount, result.page + 1),
          })}
          className={`rounded-lg border border-border px-3 py-2 text-sm ${
            result.page >= result.pageCount
              ? "pointer-events-none opacity-40"
              : ""
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
