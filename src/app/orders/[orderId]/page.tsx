import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOrderForActor } from "@/modules/orders/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  const { orderId } = await params;
  const order = await getOrderForActor(actor, orderId);
  const primarySellerId = order.groups[0]?.sellerId;

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Order
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{order.orderNumber}</h1>
        <p className="mt-2 text-muted">
          Status: {order.status} · Total {formatPaise(order.totalPaise)}
        </p>
      </div>
      <section>
        <h2 className="text-lg font-semibold">Lines</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.lines.map((line) => (
            <li key={line.id}>
              {line.productTitle} / {line.variantTitle} × {line.quantity} ·{" "}
              {formatPaise(line.lineTotalPaise)}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Fulfilment</h2>
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {order.groups.map((group) => (
            <li key={group.id}>
              {group.status}
              {group.trackingNumber
                ? ` · ${group.carrier} ${group.trackingNumber}`
                : ""}
              {group.shipment ? ` · shipment ${group.shipment.status}` : ""}
            </li>
          ))}
          {order.groups.length === 0 ? <li>No fulfilment groups.</li> : null}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Payments</h2>
        <ul className="mt-2 text-sm">
          {order.payments.map((payment) => (
            <li key={payment.id}>
              {payment.provider} · {payment.status} ·{" "}
              {formatPaise(payment.amountPaise)} · {payment.providerReference}
            </li>
          ))}
          {order.payments.length === 0 ? <li>No payment attempts yet.</li> : null}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Refunds</h2>
        <ul className="mt-2 text-sm">
          {order.refunds.map((refund) => (
            <li key={refund.id}>
              {refund.status} · {formatPaise(refund.amountPaise)} ·{" "}
              {refund.reason}
            </li>
          ))}
          {order.refunds.length === 0 ? <li>No refunds.</li> : null}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Invoices</h2>
        <ul className="mt-2 text-sm">
          {order.invoices.map((invoice) => (
            <li key={invoice.id}>
              {invoice.invoiceNumber} · {invoice.status} ·{" "}
              {formatPaise(invoice.totalPaise)}
            </li>
          ))}
          {order.invoices.length === 0 ? (
            <li>Issued after a successful mock payment.</li>
          ) : null}
        </ul>
      </section>
      <p className="text-sm">
        <Link
          href={`/support?orderId=${order.id}${primarySellerId ? `&sellerId=${primarySellerId}` : ""}`}
          className="underline"
        >
          Support / returns
        </Link>
        {" · "}
        <Link href="/orders" className="underline">
          All orders
        </Link>
      </p>
    </main>
  );
}
