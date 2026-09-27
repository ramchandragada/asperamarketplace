import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { PageShell } from "@/components/ui/page-shell";
import {
  listActiveBrands,
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Popular Products | Aspera Marketplace",
  description: "Trending and top-rated products on Aspera Marketplace.",
};

export default async function PopularPage() {
  const [result, categories, brands] = await Promise.all([
    searchApprovedProducts({
      page: 1,
      pageSize: 24,
      sort: "rating",
    }),
    listActiveCategories(),
    listActiveBrands(),
  ]);

  return (
    <PageShell>
      <CatalogueBrowse
        initialItems={result.items as BrowseProduct[]}
        initialQuery=""
        initialTotal={result.total}
        categories={categories.map((category) => ({
          slug: category.slug,
          name: category.name,
          productCount: category.productCount,
        }))}
        brands={brands}
        initialSort="rating"
        heading="Popular"
        browseBasePath="/popular"
        enableLoadMore
      />
    </PageShell>
  );
}
