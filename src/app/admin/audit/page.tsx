import { listAuditLogs } from "@/modules/admin/audit";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const action = params.action?.trim() || undefined;
  const rows = await listAuditLogs(actor!, { action, take: 100 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Audit log</h1>
        <p className="mt-2 text-muted">
          Append-only privileged actions. Newest first.
        </p>
        <form className="mt-4 flex flex-wrap gap-2" method="get">
          <input
            name="action"
            defaultValue={action ?? ""}
            placeholder="Filter by action (e.g. seller)"
            className="min-w-[16rem] flex-1 rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-sm)] bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
          >
            Filter
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
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
              {rows.map((row) => (
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
    </div>
  );
}
