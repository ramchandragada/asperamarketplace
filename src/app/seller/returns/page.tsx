import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerFulfilmentPanel } from "@/components/seller-fulfilment-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalActor } from "@/modules/identity/service";
import { listReturnsForSeller } from "@/modules/fulfilment/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller returns" };

export default async function SellerReturnsPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "returns.review");
  if (!seller) {
    return (
      <EmptyState
        title="Returns access unavailable"
        description="Requires seller owner, operations, or support capability."
        action={
          <Link href="/seller" className="text-sm underline">
            Dashboard
          </Link>
        }
      />
    );
  }

  const returns = await listReturnsForSeller(actor, seller.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Returns</h1>
        <p className="mt-2 text-muted">
          Open and recent return requests for{" "}
          {seller.tradeName ?? seller.legalName}.
        </p>
      </div>
      <SellerFulfilmentPanel
        sellerId={seller.id}
        initialGroups={[]}
        initialReturns={returns}
        returnsOnly
      />
    </div>
  );
}
