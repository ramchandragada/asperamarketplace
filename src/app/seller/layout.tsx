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
  // Shoppers (and any signed-in user without a seller workspace) should not
  // land in the operator shell with an empty "No seller workspace" state.
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
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </PageShell>
    </OperatorChrome>
  );
}
