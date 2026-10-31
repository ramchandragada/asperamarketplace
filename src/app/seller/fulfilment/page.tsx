import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerFulfilmentPanel } from "@/components/seller-fulfilment-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { getOptionalActor } from "@/modules/identity/service";
import { listSellerFulfilment } from "@/modules/fulfilment/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller orders" };

export default async function SellerFulfilmentPage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "fulfilment.write");

  if (!seller) {
    return (
      <EmptyState
        title="Orders access unavailable"
        description="Requires seller operations or owner capability."
        action={
          <Link href="/seller" className="text-sm underline">
            Dashboard
          </Link>
        }
      />
    );
  }

  const groups = await listSellerFulfilment(actor, seller.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Orders</h1>
        <p className="mt-2 text-muted">
          Process, ship, deliver, or cancel paid groups for{" "}
          {seller.tradeName ?? seller.legalName}.
        </p>
      </div>
      <SellerFulfilmentPanel
        key={seller.id}
        sellerId={seller.id}
        initialGroups={groups}
        initialReturns={[]}
      />
    </div>
  );
}
