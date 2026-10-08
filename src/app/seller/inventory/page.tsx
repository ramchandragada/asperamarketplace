import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerInventoryPanel } from "@/components/seller-inventory-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { listSellerInventory } from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller inventory" };

export default async function SellerInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login?next=/seller/inventory");

  const seller = await resolveSellerForActor(actor, "catalogue.write");
  if (!seller) {
    return (
      <EmptyState
        title="Inventory access unavailable"
        description="Requires an approved seller and catalogue capability."
        action={
          <Link href="/seller/onboarding" className="text-sm underline">
            Onboarding
          </Link>
        }
      />
    );
  }

  const params = await searchParams;
  const filter =
    params.filter === "low_stock" || params.filter === "out_of_stock"
      ? params.filter
      : "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const q = params.q?.trim() ?? "";
  const result = await listSellerInventory(actor, seller.id, {
    filter,
    q: q || undefined,
    page,
    pageSize: 25,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-2 text-muted">
          Stock for {seller.tradeName ?? seller.legalName}. Available = on hand −
          reserved.
        </p>
      </div>
      <SellerInventoryPanel
        key={`${filter}|${q}|${result.page}`}
        sellerId={seller.id}
        filter={filter}
        initialQuery={q}
        initialPage={result.page}
        initialPageSize={result.pageSize}
        initialTotal={result.total}
        initialRows={result.items}
      />
    </div>
  );
}
