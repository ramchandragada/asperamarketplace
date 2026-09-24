import Link from "next/link";
import { redirect } from "next/navigation";
import { SellerCataloguePanel } from "@/components/seller-catalogue-panel";
import {
  ensureGenericCategory,
  listActiveCategories,
  listSellerProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seller catalogue · Aspera Marketplace" };

export default async function SellerCataloguePage() {
  const actor = await getOptionalActor();
  if (!actor) {
    redirect("/login");
  }

  const seller = await prisma.seller.findFirst({
    where: {
      ownerUserId: actor.userId,
      status: "approved",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!seller) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <h1 className="text-3xl font-semibold">Seller catalogue</h1>
        <p className="text-muted">
          An approved seller profile is required before creating listings.
        </p>
        <Link href="/seller/onboarding" className="underline">
          Go to seller onboarding
        </Link>
      </main>
    );
  }

  await ensureGenericCategory();
  const [categories, products] = await Promise.all([
    listActiveCategories(),
    listSellerProducts(actor, seller.id),
  ]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-muted uppercase">
          Seller
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Catalogue</h1>
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
      <p className="text-sm">
        <Link href="/account" className="underline">
          Back to account
        </Link>
      </p>
    </main>
  );
}
