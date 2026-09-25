import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { PageShell } from "@/components/ui/page-shell";
import {
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shop All Products | Aspera Marketplace",
  description: "Browse all products across every category on Aspera Marketplace.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categorySlug?: string;
    sort?: string;
    inStockOnly?: string;
    verifiedSellerOnly?: string;
    minPricePaise?: string;
    maxPricePaise?: string;
    minRating?: string;
    minDiscountPercent?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const categorySlug = params.categorySlug?.trim() ?? "";
  const sort =
    params.sort === "price_asc" || params.sort === "price_desc"
      ? params.sort
      : "newest";
  const inStockOnly = params.inStockOnly === "true";
  const verifiedSellerOnly = params.verifiedSellerOnly === "true";

  const [result, categories] = await Promise.all([
    searchApprovedProducts({
      q: query || undefined,
      categorySlug: categorySlug || undefined,
      sort,
      inStockOnly,
      verifiedSellerOnly,
      minPricePaise: params.minPricePaise
        ? Number(params.minPricePaise)
        : undefined,
      maxPricePaise: params.maxPricePaise
        ? Number(params.maxPricePaise)
        : undefined,
      minRating: params.minRating ? Number(params.minRating) : undefined,
      minDiscountPercent: params.minDiscountPercent
        ? Number(params.minDiscountPercent)
        : undefined,
      page: 1,
      pageSize: 24,
    }),
    listActiveCategories(),
  ]);

  return (
    <PageShell>
      <CatalogueBrowse
        initialItems={result.items as BrowseProduct[]}
        initialQuery={query}
        initialTotal={result.total}
        categories={categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          productCount: category.productCount,
        }))}
        initialCategorySlug={categorySlug}
        initialSort={sort}
        initialInStockOnly={inStockOnly}
        initialVerifiedOnly={verifiedSellerOnly}
        initialMinRating={params.minRating ? Number(params.minRating) : undefined}
        initialMinDiscount={
          params.minDiscountPercent
            ? Number(params.minDiscountPercent)
            : undefined
        }
        heading="All products"
        browseBasePath="/shop"
      />
    </PageShell>
  );
}
