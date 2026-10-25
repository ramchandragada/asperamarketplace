import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { PageShell } from "@/components/ui/page-shell";
import { parseFacetSearchParams } from "@/modules/catalogue/category-facets";
import {
  listActiveCategories,
  listBrandFilterIndex,
  searchApprovedProducts,
} from "@/modules/catalogue/service";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shop All Products",
  description: "Browse all products across every category on Aspera Marketplace.",
};

const SORTS = new Set([
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
]);

const AUDIENCES = new Set(["women", "men", "kids", "unisex"]);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const query = read("q")?.trim() ?? "";
  const categorySlug = read("categorySlug")?.trim() ?? "";
  const brandSlug = read("brandSlug")?.trim() ?? "";
  const audienceRaw = read("audience")?.trim() ?? "";
  const audience = AUDIENCES.has(audienceRaw)
    ? (audienceRaw as "women" | "men" | "kids" | "unisex")
    : undefined;
  const sort = SORTS.has(read("sort") ?? "")
    ? (read("sort") as string)
    : query
      ? "relevance"
      : "newest";
  const inStockOnly = read("inStockOnly") === "true";
  const verifiedSellerOnly = read("verifiedSellerOnly") === "true";
  const minPricePaise = read("minPricePaise")
    ? Number(read("minPricePaise"))
    : undefined;
  const maxPricePaise = read("maxPricePaise")
    ? Number(read("maxPricePaise"))
    : undefined;
  const facets = parseFacetSearchParams(params);

  const [categories, brandIndex] = await Promise.all([
    listActiveCategories(),
    listBrandFilterIndex(),
  ]);

  const brandsForCategory = categorySlug
    ? (brandIndex.byCategory[categorySlug] ?? [])
    : brandIndex.all;
  const resolvedBrandSlug =
    brandSlug && brandsForCategory.some((brand) => brand.slug === brandSlug)
      ? brandSlug
      : "";

  const result = await searchApprovedProducts({
    q: query || undefined,
    categorySlug: categorySlug || undefined,
    brandSlug: resolvedBrandSlug || undefined,
    audience,
    facets: Object.keys(facets).length > 0 ? facets : undefined,
    sort: sort as
      | "relevance"
      | "newest"
      | "price_asc"
      | "price_desc"
      | "rating",
    inStockOnly,
    verifiedSellerOnly,
    minPricePaise,
    maxPricePaise,
    minRating: read("minRating") ? Number(read("minRating")) : undefined,
    minDiscountPercent: read("minDiscountPercent")
      ? Number(read("minDiscountPercent"))
      : undefined,
    page: 1,
    pageSize: 24,
  });

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
        brands={brandIndex.all}
        brandsByCategory={brandIndex.byCategory}
        initialCategorySlug={categorySlug}
        initialBrandSlug={resolvedBrandSlug}
        initialAudience={audience ?? ""}
        initialSort={sort}
        initialInStockOnly={inStockOnly}
        initialVerifiedOnly={verifiedSellerOnly}
        initialMinRating={read("minRating") ? Number(read("minRating")) : undefined}
        initialMinDiscount={
          read("minDiscountPercent")
            ? Number(read("minDiscountPercent"))
            : undefined
        }
        initialMinPricePaise={minPricePaise}
        initialMaxPricePaise={maxPricePaise}
        initialFacets={facets}
        heading="All products"
        browseBasePath="/shop"
        enableLoadMore
      />
    </PageShell>
  );
}
