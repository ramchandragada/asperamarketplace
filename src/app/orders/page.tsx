import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { OrdersPanel } from "@/components/orders-panel";
import { PageShell } from "@/components/ui/page-shell";
import { listOrdersForActor } from "@/modules/orders/service";
import { getOptionalActor } from "@/modules/identity/service";
import { mockSelfPayAllowed } from "@/modules/payments/provider";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Orders" };

export default async function OrdersPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login?next=/orders");
  }
  const orders = await listOrdersForActor(actor);

  return (
    <PageShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Account
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            Your Orders
          </h1>
          <p className="mt-2 max-w-2xl text-muted">
            Track shipments, download invoices, reorder, or start a return —
            filters on the left help you find the right order fast.
          </p>
        </div>
        <p className="text-sm text-muted">
          <Link href="/account" className="text-accent hover:underline">
            Back to account
          </Link>
          {" · "}
          <Link href="/account/returns" className="text-accent hover:underline">
            Returns inbox
          </Link>
        </p>
      </div>

      <Suspense fallback={<p className="text-muted">Loading orders…</p>}>
        <OrdersPanel
          allowMockSelfPay={mockSelfPayAllowed()}
          initialOrders={orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            totalPaise: order.totalPaise,
            createdAt: order.createdAt.toISOString(),
            paidAt: order.paidAt?.toISOString() ?? null,
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
              variantTitle: line.variantTitle,
              quantity: line.quantity,
              variantId: line.variantId,
              unitPricePaise: line.unitPricePaise,
              lineTotalPaise: line.lineTotalPaise,
              productSlug: line.productSlug,
              imageUrl: line.imageUrl,
              imageAlt: line.imageAlt,
            })),
            address: order.address
              ? {
                  fullName: order.address.fullName,
                  city: order.address.city,
                  state: order.address.state,
                }
              : null,
            groups: order.groups.map((group) => ({
              id: group.id,
              status: group.status,
              shippedAt: group.shippedAt?.toISOString() ?? null,
              deliveredAt: group.deliveredAt?.toISOString() ?? null,
              trackingUrl: group.trackingUrl,
              trackingNumber: group.trackingNumber,
              carrier: group.carrier,
            })),
            returnRequests: order.returnRequests.map((entry) => ({
              id: entry.id,
              status: entry.status,
            })),
          }))}
        />
      </Suspense>
    </PageShell>
  );
}
