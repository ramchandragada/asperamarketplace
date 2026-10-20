import Link from "next/link";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import {
  ADMIN_ORDER_STATUSES,
  listAdminOrders,
  parseAdminOrderStatus,
  type AdminOrderStatusFilter,
} from "@/modules/orders/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin orders" };

function buildHref(next: {
  status?: AdminOrderStatusFilter;
  q?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const status = parseAdminOrderStatus(params.status);
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const result = await listAdminOrders(actor!, {
    status,
    q: q || undefined,
    page,
    pageSize: 25,
  });

  const tabs: Array<{ key: AdminOrderStatusFilter; label: string }> = [
    { key: "all", label: "All" },
    ...ADMIN_ORDER_STATUSES.map((key) => ({
      key,
      label: key.replaceAll("_", " "),
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-2 text-muted">
          Platform order list — read-only. Totals match Analytics “Orders by
          status”.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const count =
            tab.key === "all"
              ? result.counts.all
              : result.counts[tab.key as keyof typeof result.counts];
          const active = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={buildHref({ status: tab.key, q: q || undefined })}
              className={`rounded-full px-3 py-1.5 text-sm capitalize ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "border border-border hover:bg-accent-soft/60"
              }`}
            >
              {tab.label} ({count})
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order #, email, or name"
          className="min-w-[16rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Seller(s)</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((order) => {
              const sellers = [
                ...new Map(
                  order.groups.map((group) => [
                    group.seller.id,
                    group.seller.tradeName ?? group.seller.legalName,
                  ]),
                ).values(),
              ];
              return (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {order.createdAt.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3">
                    <div>{order.user.displayName}</div>
                    <div className="text-muted">{order.user.email}</div>
                  </td>
                  <td className="px-3 py-3">{sellers.join(", ") || "—"}</td>
                  <td className="px-3 py-3 capitalize">
                    {order.status.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatPaise(order.totalPaise)}
                  </td>
                </tr>
              );
            })}
            {result.items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted"
                >
                  No orders match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="text-muted">
          {result.total} order{result.total === 1 ? "" : "s"} · page{" "}
          {result.page} of {result.pageCount}
        </p>
        <div className="flex gap-2">
          {result.page > 1 ? (
            <Link
              href={buildHref({
                status,
                q: q || undefined,
                page: result.page - 1,
              })}
              className="rounded-lg border border-border px-3 py-2"
            >
              Previous
            </Link>
          ) : null}
          {result.page < result.pageCount ? (
            <Link
              href={buildHref({
                status,
                q: q || undefined,
                page: result.page + 1,
              })}
              className="rounded-lg border border-border px-3 py-2"
            >
              Next
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
