import { redirect } from "next/navigation";
import { SellerNav } from "@/components/seller-nav";
import { PageShell } from "@/components/ui/page-shell";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { actorHasSellerCapability } from "@/modules/identity/policy";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }

  const seller = await resolveSellerForActor(actor, "dashboard.read");
  const sellerName = seller
    ? (seller.tradeName ?? seller.legalName)
    : "Seller workspace";
  const sellerId = seller?.id;
  const isOwner = seller ? seller.ownerUserId === actor.userId : false;
  const capabilities = {
    catalogue: Boolean(
      sellerId &&
        (isOwner ||
          actorHasSellerCapability(actor, sellerId, "catalogue.write")),
    ),
    fulfilment: Boolean(
      sellerId &&
        (isOwner ||
          actorHasSellerCapability(actor, sellerId, "fulfilment.write")),
    ),
    returns: Boolean(
      sellerId &&
        (isOwner ||
          actorHasSellerCapability(actor, sellerId, "returns.review")),
    ),
    finance: Boolean(
      sellerId &&
        (isOwner || actorHasSellerCapability(actor, sellerId, "finance.read")),
    ),
  };

  return (
    <PageShell>
      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="md:sticky md:top-24 md:self-start">
          <SellerNav sellerName={sellerName} capabilities={capabilities} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}
