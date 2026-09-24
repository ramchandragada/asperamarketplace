import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminProductQueue } from "@/components/admin-product-queue";
import { listProductsForModeration } from "@/modules/catalogue/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { getOptionalActor } from "@/modules/identity/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product moderation · Aspera Marketplace" };

export default async function AdminProductsPage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }
  if (!actorIsAdmin(actor)) {
    redirect("/account");
  }
  const products = await listProductsForModeration(actor);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Product moderation</h1>
        <p className="mt-2 text-muted">
          Approvals write an audit row and a ProductApproved outbox event.
        </p>
      </div>
      <AdminProductQueue initialProducts={products} />
      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </main>
  );
}
