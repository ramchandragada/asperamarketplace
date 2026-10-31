import { redirect } from "next/navigation";
import { OperatorChrome } from "@/components/operator-chrome";
import { SellerNav } from "@/components/seller-nav";
import { PageShell } from "@/components/ui/page-shell";
import { redirectToLogin } from "@/lib/login-redirect";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import {
  actorHasSellerCapability,
  actorIsAdmin,
} from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    await redirectToLogin("/seller");
  }
  if (!actor) return null;

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  if (!seller) {
    if (actorIsAdmin(actor)) {
      redirect("/admin");
    }
    redirect("/sell");
  }

  const sellerName = seller.tradeName ?? seller.legalName;
  const sellerId = seller.id;
  const isOwner = seller.ownerUserId === actor.userId;
  const capabilities = {
    catalogue: Boolean(
      isOwner || actorHasSellerCapability(actor, sellerId, "catalogue.write"),
    ),
    fulfilment: Boolean(
      isOwner ||
        actorHasSellerCapability(actor, sellerId, "fulfilment.write"),
    ),
    returns: Boolean(
      isOwner || actorHasSellerCapability(actor, sellerId, "returns.review"),
    ),
    finance: Boolean(
      isOwner || actorHasSellerCapability(actor, sellerId, "finance.read"),
    ),
  };

  const [ordersBadge, returnsBadge, inventoryRows, productsAttention] =
    await Promise.all([
      prisma.orderFulfilmentGroup.count({
        where: {
          sellerId,
          status: { in: ["pending", "processing"] },
        },
      }),
      prisma.returnRequest.count({
        where: { sellerId, status: { in: ["requested", "approved"] } },
      }),
      prisma.inventoryItem.findMany({
        where: {
          sellerId,
          variant: { isActive: true, product: { status: "approved" } },
        },
        select: { onHand: true, reserved: true },
        take: 500,
      }),
      prisma.product.count({
        where: {
          sellerId,
          status: { in: ["draft", "submitted", "rejected"] },
        },
      }),
    ]);
  const oosBadge = inventoryRows.filter(
    (row) => row.onHand - row.reserved <= 0,
  ).length;

  return (
    <OperatorChrome
      surface="seller"
      title={sellerName}
      subtitle={actor.displayName}
      showAdmin={actorIsAdmin(actor)}
      showSeller
    >
      <PageShell>
        <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="md:sticky md:top-6 md:self-start">
            <SellerNav
              sellerName={sellerName}
              displayName={actor.displayName}
              showAdmin={actorIsAdmin(actor)}
              capabilities={capabilities}
              badges={{
                orders: ordersBadge,
                returns: returnsBadge,
                inventory: oosBadge,
                products: productsAttention,
              }}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </PageShell>
    </OperatorChrome>
  );
}
