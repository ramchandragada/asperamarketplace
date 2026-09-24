import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSellerQueue } from "@/components/admin-seller-queue";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";
import { listSellersForAdmin } from "@/modules/seller/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller approvals · Aspera Marketplace" };

export default async function AdminSellersPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }
  const sellers = await listSellersForAdmin(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Seller approval queue</h1>
        <p className="mt-2 text-muted">
          Approvals write an audit row and a SellerApproved outbox event.
        </p>
      </div>
      <AdminSellerQueue initialSellers={sellers} />
      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </main>
  );
}
