import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderDetailPanel } from "@/components/order-detail-panel";
import { PageShell } from "@/components/ui/page-shell";
import { formatPaise } from "@/modules/catalogue/helpers";
import { getOrderForActor, OrderValidationError } from "@/modules/orders/service";
import { getOptionalActor } from "@/modules/identity/service";
import { orderStatusLabel } from "@/lib/status-labels";

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
  let order;
  try {
    order = await getOrderForActor(actor, orderId);
  } catch (error) {
    // An unknown or someone else's order id is a 404, not a server error.
    if (error instanceof OrderValidationError) {
      notFound();
    }
    throw error;
  }

  return (
    <PageShell narrow>
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
          Order
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {order.orderNumber}
        </h1>
        <p className="mt-2 text-muted">
          {orderStatusLabel(order.status)} · {formatPaise(order.totalPaise)}
        </p>
      </div>

      <OrderDetailPanel
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalPaise: order.totalPaise,
          createdAt: order.createdAt.toISOString(),
          paidAt: order.paidAt?.toISOString() ?? null,
          cancelledAt: order.cancelledAt?.toISOString() ?? null,
          lines: order.lines.map((line) => ({
            id: line.id,
            productId: line.productId,
            variantId: line.variantId,
            sellerId: line.sellerId,
            productTitle: line.productTitle,
            variantTitle: line.variantTitle,
            quantity: line.quantity,
            lineTotalPaise: line.lineTotalPaise,
          })),
          groups: order.groups.map((group) => ({
            id: group.id,
            sellerId: group.sellerId,
            sellerName:
              group.seller.tradeName ?? group.seller.legalName ?? "Seller",
            status: group.status,
            carrier: group.carrier,
            trackingNumber: group.trackingNumber,
            trackingUrl: group.trackingUrl,
            shippedAt: group.shippedAt?.toISOString() ?? null,
            deliveredAt: group.deliveredAt?.toISOString() ?? null,
            cancelledAt: group.cancelledAt?.toISOString() ?? null,
            shipment: group.shipment
              ? {
                  status: group.shipment.status,
                  trackingUrl: group.shipment.trackingUrl,
                }
              : null,
          })),
          payments: order.payments.map((payment) => ({
            id: payment.id,
            provider: payment.provider,
            status: payment.status,
            amountPaise: payment.amountPaise,
            providerReference: payment.providerReference,
          })),
          refunds: order.refunds.map((refund) => ({
            id: refund.id,
            status: refund.status,
            amountPaise: refund.amountPaise,
            reason: refund.reason,
          })),
          invoices: order.invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            totalPaise: invoice.totalPaise,
          })),
          returnRequests: order.returnRequests.map((entry) => ({
            id: entry.id,
            status: entry.status,
            reason: entry.reason,
            quantity: entry.quantity,
            orderLineId: entry.orderLineId,
            sellerId: entry.sellerId,
          })),
          protectionClaims: order.protectionClaims.map((claim) => ({
            id: claim.id,
            orderLineId: claim.orderLineId,
            status: claim.status,
            claimType: claim.claimType,
          })),
          address: order.address
            ? {
                fullName: order.address.fullName,
                phone: order.address.phone,
                line1: order.address.line1,
                city: order.address.city,
                state: order.address.state,
                postalCode: order.address.postalCode,
              }
            : null,
        }}
      />

      <p className="text-sm">
        <Link href={`/support?orderId=${order.id}`} className="underline">
          Contact support
        </Link>
        {" · "}
        <Link href="/orders" className="underline">
          All orders
        </Link>
        {" · "}
        <Link href="/account" className="underline">
          Account
        </Link>
      </p>
    </PageShell>
  );
}
