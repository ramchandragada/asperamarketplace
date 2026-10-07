import { AdminProductQueue } from "@/components/admin-product-queue";
import { listProductsForModeration } from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product moderation" };

export default async function AdminProductsPage() {
  const actor = await getOptionalActor();
  const products = await listProductsForModeration(actor!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Product moderation</h1>
        <p className="mt-2 text-muted">
          Approve or reject submitted catalogue listings.
        </p>
      </div>
      <AdminProductQueue initialProducts={products} />
    </div>
  );
}
