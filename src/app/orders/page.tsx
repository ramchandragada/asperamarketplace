import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OrdersPanel } from "@/components/orders-panel";
import { PageShell } from "@/components/ui/page-shell";
import { listOrdersForActor } from "@/modules/orders/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Orders" };

export default async function OrdersPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/orders");
  }
  const orders = await listOrdersForActor(actor);

  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Shopping
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Your orders
        </h1>
        <p className="mt-2 text-muted">
          Track, return, cancel, or buy again. Mock payments are available on
          unpaid orders.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted">Loading orders…</p>}>
        <OrdersPanel
          initialOrders={orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalPaise: order.totalPaise,
            createdAt: order.createdAt.toISOString(),
            payments: order.payments.map((payment) => ({
              id: payment.id,
              status: payment.status,
            })),
            invoices: order.invoices.map((invoice) => ({
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
            })),
            lines: order.lines.map((line) => ({
              id: line.id,
              productTitle: line.productTitle,
              quantity: line.quantity,
              variantId: line.variantId,
            })),
          }))}
        />
      </Suspense>
      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </PageShell>
  );
}
