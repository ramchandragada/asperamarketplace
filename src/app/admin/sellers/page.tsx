import {
  AdminSellerQueue,
  type AdminSellerTab,
} from "@/components/admin-seller-queue";
import { getOptionalActor } from "@/modules/identity/service";
import { listSellersForAdmin } from "@/modules/seller/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller approvals" };

const TABS = ["pending", "approved", "suspended", "all"] as const;

function parseTab(raw: string | undefined): AdminSellerTab {
  if (raw && (TABS as readonly string[]).includes(raw)) {
    return raw as AdminSellerTab;
  }
  return "pending";
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await getOptionalActor();
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const sellers = await listSellersForAdmin(actor!);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Seller approval queue</h1>
        <p className="mt-2 text-muted">
          Review onboarding, request information, suspend, or reactivate
          sellers.
        </p>
      </div>
      <AdminSellerQueue key={tab} initialSellers={sellers} tab={tab} />
    </div>
  );
}
