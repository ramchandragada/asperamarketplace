import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOptionalActor } from "@/modules/identity/service";
import { getAdminOrder } from "@/modules/orders/admin";
import { OrderValidationError } from "@/modules/orders/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const actor = await getOptionalActor();
  const { orderId } = await params;

  let detail;
  try {
    detail = await getAdminOrder(actor!, orderId);
  } catch (error) {
    if (error instanceof OrderValidationError) notFound();
    throw error;
  }

  const { order, ledgerEntries, auditEvents } = detail;
  const sellers = [
    ...new Map(
      order.groups.map((group) => [
        group.seller.id,
        group.seller.tradeName ?? group.seller.legalName,
      ]),
    ).values(),
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted">
          <Link href="/admin/orders" className="underline">
            Orders
          </Link>
          {" / "}
          {order.orderNumber}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{order.orderNumber}</h1>
        <p className="mt-2 text-muted capitalize">
          Status: {order.status.replaceAll("_", " ")} · Total{" "}
          {formatPaise(order.totalPaise)}
        </p>
        <p className="mt-1 text-sm text-muted">
          Placed {order.createdAt.toLocaleString("en-IN")} · Customer{" "}
          {order.user.displayName} ({order.user.email})
          {sellers.length > 0 ? ` · Seller(s) ${sellers.join(", ")}` : ""}
        </p>
      </div>

      <section className="grid gap-3 rounded-card border border-border bg-surface p-4 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Amounts</h2>
        <p className="text-sm">
          Merchandise {formatPaise(order.subtotalPaise)}
        </p>
        <p className="text-sm">Discount −{formatPaise(order.discountPaise)}</p>
        <p className="text-sm">Shipping {formatPaise(order.shippingPaise)}</p>
        <p className="text-sm">Tax {formatPaise(order.taxPaise)}</p>
        <p className="text-sm font-semibold sm:col-span-2">
          Customer total {formatPaise(order.totalPaise)}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Lines</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.lines.map((line) => (
            <li key={line.id}>
              {line.productTitle} / {line.variantTitle} × {line.quantity} ·{" "}
              {formatPaise(line.lineTotalPaise)} · {line.sku}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Ship to</h2>
        <p className="mt-2 text-sm">
          {order.address.fullName} · {order.address.phone}
          <br />
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}
          <br />
          {order.address.city}, {order.address.state} {order.address.postalCode}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Fulfilment</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.groups.map((group) => (
            <li key={group.id}>
              {group.seller.tradeName ?? group.seller.legalName} ·{" "}
              {group.status}
              {" · merchandise "}
              {formatPaise(group.lineTotalPaise)}
              {group.trackingNumber
                ? ` · ${group.carrier} ${group.trackingNumber}`
                : ""}
            </li>
          ))}
          {order.groups.length === 0 ? <li>No fulfilment groups.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payments</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.payments.map((payment) => (
            <li key={payment.id}>
              {payment.provider} · {payment.status} ·{" "}
              {formatPaise(payment.amountPaise)} · {payment.providerReference}
            </li>
          ))}
          {order.payments.length === 0 ? (
            <li>No payment attempts.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Invoices</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.invoices.map((invoice) => (
            <li key={invoice.id}>
              {invoice.invoiceNumber} · {invoice.status} ·{" "}
              {formatPaise(invoice.totalPaise)}
            </li>
          ))}
          {order.invoices.length === 0 ? <li>No invoices yet.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Ledger</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {ledgerEntries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/admin/finance?entry=${entry.id}`}
                className="text-accent hover:underline"
              >
                {entry.sourceEvent}
              </Link>
              {" · "}
              {entry.status}
              {entry.postedAt
                ? ` · posted ${entry.postedAt.toLocaleString("en-IN")}`
                : ""}
              <span className="text-muted"> · {entry.memo}</span>
            </li>
          ))}
          {ledgerEntries.length === 0 ? (
            <li className="text-muted">
              No journal entries for this order yet.{" "}
              <Link href="/admin/finance" className="underline">
                Open finance
              </Link>
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Audit trail</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {auditEvents.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/audit?action=${encodeURIComponent(event.action)}`}
                className="text-accent hover:underline"
              >
                {event.action}
              </Link>
              {" · "}
              {event.createdAt.toLocaleString("en-IN")}
              {event.reason ? (
                <span className="text-muted"> · {event.reason}</span>
              ) : null}
            </li>
          ))}
          {auditEvents.length === 0 ? (
            <li className="text-muted">No matching audit events.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
