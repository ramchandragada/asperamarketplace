import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPaise } from "@/modules/catalogue/helpers";
import { listSellerInventory } from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller inventory" };

export default async function SellerInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

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
  const rows = await listSellerInventory(actor, seller.id, filter);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Inventory</h1>
        <p className="mt-2 text-muted">
          Stock for {seller.tradeName ?? seller.legalName}. Available = on hand −
          reserved.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            href="/seller/inventory"
            className={`rounded-lg border px-3 py-1.5 ${filter === "all" ? "border-accent bg-accent-soft" : "border-border"}`}
          >
            All
          </Link>
          <Link
            href="/seller/inventory?filter=low_stock"
            className={`rounded-lg border px-3 py-1.5 ${filter === "low_stock" ? "border-accent bg-accent-soft" : "border-border"}`}
          >
            Low stock
          </Link>
          <Link
            href="/seller/inventory?filter=out_of_stock"
            className={`rounded-lg border px-3 py-1.5 ${filter === "out_of_stock" ? "border-accent bg-accent-soft" : "border-border"}`}
          >
            Out of stock
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No SKUs in this view"
          description="Adjust the filter or add catalogue products."
          action={
            <Link href="/seller/catalogue" className="text-sm underline">
              Catalogue
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">On hand</th>
                <th className="px-3 py-2">Reserved</th>
                <th className="px-3 py-2">Available</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.inventoryItemId} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/seller/catalogue/${row.productId}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {row.productTitle}
                    </Link>
                    <p className="text-xs text-muted">{row.productStatus}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{row.sku}</td>
                  <td className="px-3 py-2">
                    {formatPaise(row.sellingPricePaise)}
                  </td>
                  <td className="px-3 py-2">{row.onHand}</td>
                  <td className="px-3 py-2">{row.reserved}</td>
                  <td className="px-3 py-2 font-semibold">{row.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
