import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerFulfilmentPanel } from "@/components/seller-fulfilment-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalActor } from "@/modules/identity/service";
import {
  listReturnsForSeller,
  listSellerFulfilment,
} from "@/modules/fulfilment/service";
import { resolveSellerForActor } from "@/modules/seller/access";
import { actorHasSellerCapability } from "@/modules/identity/policy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller fulfilment · Aspera Marketplace" };

export default async function SellerFulfilmentPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const canFulfil = await resolveSellerForActor(actor, "fulfilment.write");
  const canReturns = await resolveSellerForActor(actor, "returns.review");
  const seller = canFulfil ?? canReturns;

  if (!seller) {
    return (
      <EmptyState
        title="Orders access unavailable"
        description="Requires seller operations/owner for fulfilment, or support role for returns."
        action={
          <Link href="/seller" className="text-sm underline">
            Dashboard
          </Link>
        }
      />
    );
  }

  const groups = actorHasSellerCapability(actor, seller.id, "fulfilment.write") ||
  seller.ownerUserId === actor.userId
    ? await listSellerFulfilment(actor, seller.id)
    : [];
  const returns =
    actorHasSellerCapability(actor, seller.id, "returns.review") ||
    seller.ownerUserId === actor.userId
      ? await listReturnsForSeller(actor, seller.id)
      : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders & returns</h1>
        <p className="mt-2 text-muted">
          Process, ship, deliver, or cancel paid groups for{" "}
          {seller.tradeName ?? seller.legalName}. Mock logistics only.
        </p>
      </div>
      <SellerFulfilmentPanel
        sellerId={seller.id}
        initialGroups={groups}
        initialReturns={returns}
      />
    </div>
  );
}
