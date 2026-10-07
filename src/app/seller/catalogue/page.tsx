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
export const metadata = { title: "Seller catalogue" };

export default async function SellerCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
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

  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const status = params.status?.trim() ?? "";
  const q = params.q?.trim() ?? "";
  await ensureGenericCategory();
  const [categories, listed] = await Promise.all([
    listActiveCategories(),
    listSellerProducts(actor, seller.id, {
      page,
      pageSize: 25,
      q: q || undefined,
      status: (status || undefined) as
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "archived"
        | undefined,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="mt-2 text-muted">
          Draft and manage listings for {seller.tradeName ?? seller.legalName}.
          Submit for moderation before they appear publicly.
        </p>
      </div>
      <SellerCataloguePanel
        key={`${status}|${q}|${listed.page}`}
        sellerId={seller.id}
        categories={categories}
        initialProducts={listed.items}
        initialTotal={listed.total}
        initialPage={listed.page}
        initialPageSize={listed.pageSize}
        initialQuery={q}
        initialStatus={status}
      />
    </div>
  );
}
