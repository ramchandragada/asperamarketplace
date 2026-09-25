import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerCataloguePanel } from "@/components/seller-catalogue-panel";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ensureGenericCategory,
  listActiveCategories,
  listSellerProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { resolveSellerForActor } from "@/modules/seller/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller catalogue · Aspera Marketplace" };

export default async function SellerCataloguePage() {
  const actor = await getOptionalActor();
  if (!actor) redirect("/login");

  const seller = await resolveSellerForActor(actor, "catalogue.write");
  if (!seller) {
    return (
      <EmptyState
        title="Catalogue access unavailable"
        description="Requires an approved seller and owner/operations capability."
        action={
          <Link href="/seller/onboarding" className="text-sm underline">
            Onboarding
          </Link>
        }
      />
    );
  }

  await ensureGenericCategory();
  const [categories, products] = await Promise.all([
    listActiveCategories(),
    listSellerProducts(actor, seller.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Products & inventory</h1>
        <p className="mt-2 text-muted">
          Draft listings for {seller.tradeName ?? seller.legalName}. Submit for
          moderation before they appear publicly.
        </p>
      </div>
      <SellerCataloguePanel
        sellerId={seller.id}
        categories={categories}
        initialProducts={products}
      />
    </div>
  );
}
