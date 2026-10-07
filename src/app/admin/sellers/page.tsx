import { AdminSellerQueue } from "@/components/admin-seller-queue";
import { getOptionalActor } from "@/modules/identity/service";
import { listSellersForAdmin } from "@/modules/seller/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller approvals" };

export default async function AdminSellersPage() {
  const actor = await getOptionalActor();
  const sellers = await listSellersForAdmin(actor!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Seller approval queue</h1>
        <p className="mt-2 text-muted">
          Review submitted sellers and approve or reject onboarding.
        </p>
      </div>
      <AdminSellerQueue initialSellers={sellers} />
    </div>
  );
}
