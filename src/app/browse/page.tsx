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
export const metadata = { title: "Shop · Aspera Marketplace" };

const SORTS = new Set([
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "rating",
]);

const AUDIENCES = new Set(["women", "men", "kids", "unisex"]);
const AUDIENCE_HEADINGS: Record<string, string> = {
  women: "Women",
  men: "Men",
  kids: "Kids",
  unisex: "Unisex",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    categorySlug?: string;
    brandSlug?: string;
    audience?: string;
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
  const brandSlug = params.brandSlug?.trim() ?? "";
  const audienceRaw = params.audience?.trim() ?? "";
  const audience = AUDIENCES.has(audienceRaw)
    ? (audienceRaw as "women" | "men" | "kids" | "unisex")
    : undefined;
  const sort = SORTS.has(params.sort ?? "")
    ? (params.sort as string)
    : query
      ? "relevance"
      : "newest";
  const inStockOnly = params.inStockOnly === "true";
  const verifiedSellerOnly = params.verifiedSellerOnly === "true";
  const minPricePaise = params.minPricePaise
    ? Number(params.minPricePaise)
    : undefined;
  const maxPricePaise = params.maxPricePaise
    ? Number(params.maxPricePaise)
    : undefined;

  const [result, categories, brands] = await Promise.all([
    searchApprovedProducts({
      q: query || undefined,
      categorySlug: categorySlug || undefined,
      brandSlug: brandSlug || undefined,
      audience,
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
      minRating: params.minRating ? Number(params.minRating) : undefined,
      minDiscountPercent: params.minDiscountPercent
        ? Number(params.minDiscountPercent)
        : undefined,
      page: 1,
      pageSize: 24,
    }),
    listActiveCategories(),
    listActiveBrands(),
  ]);

  const heading =
    (audience ? AUDIENCE_HEADINGS[audience] : undefined) ??
    categories.find((category) => category.slug === categorySlug)?.name ??
    (query ? undefined : "Shop");

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
        brands={brands}
        initialCategorySlug={categorySlug}
        initialBrandSlug={brandSlug}
        initialAudience={audience ?? ""}
        initialSort={sort}
        initialInStockOnly={inStockOnly}
        initialVerifiedOnly={verifiedSellerOnly}
        initialMinRating={params.minRating ? Number(params.minRating) : undefined}
        initialMinDiscount={
          params.minDiscountPercent
            ? Number(params.minDiscountPercent)
            : undefined
        }
        initialMinPricePaise={minPricePaise}
        initialMaxPricePaise={maxPricePaise}
        heading={heading}
        browseBasePath="/browse"
      />
    </PageShell>
  );
}
