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

  const openCount = groups.filter(
    (g) => g.status === "pending" || g.status === "processing",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border border-border bg-surface px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
            Order desk
          </p>
          <h1 className="mt-0.5 font-display text-[22px] font-semibold tracking-tight">
            Manage orders
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Process, ship, deliver, or cancel paid groups ·{" "}
            {seller.tradeName ?? seller.legalName}
          </p>
        </div>
        <p className="text-[13px] font-semibold">
          <span className={openCount > 0 ? "text-warning" : "text-success"}>
            {openCount} to ship
          </span>
          <span className="text-muted"> · {groups.length} total</span>
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
