import Link from "next/link";
import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { ProductCard } from "@/components/product-card";
import { TrendingProductsRail } from "@/components/trending-products-rail";
import { SectionHeading } from "@/components/ui/page-shell";
import {
  AsperaHero,
  BuildLanes,
  FeaturedSellers,
  PriceLedCollections,
  SellerConversionSection,
  ShopByBrands,
  ShopByCategory,
} from "@/components/home-storefront";
import {
  listBrandFilterIndex,
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { slugify } from "@/modules/catalogue/helpers";
import { ASPERA_BRAND_LANES, ASPERA_CATEGORY_TILES } from "@/lib/mega-menu";

export const dynamic = "force-dynamic";

/** Build lanes — Gaming / Creator / Office */
const BUILD_LANES = [
  {
    id: "gaming",
    label: "Gaming",
    description: "GPUs, X3D CPUs, high-refresh monitors",
    href: "/browse?categorySlug=graphics-cards",
    imageUrl: "/hero/build-gaming.jpg",
  },
  {
    id: "creator",
    label: "Creator",
    description: "Multi-core CPUs, fast NVMe, colour-ready panels",
    href: "/browse?categorySlug=processors&q=Ryzen+7",
    imageUrl: "/hero/build-creator.jpg",
  },
  {
    id: "office",
    label: "Office",
    description: "Reliable CPUs, SSDs, and UPS for Pune power cuts",
    href: "/browse?categorySlug=processors&q=i5",
    imageUrl: "/hero/build-office.jpg",
  },
] as const;

const PRICE_COLLECTIONS = [
  {
    id: "u5k",
    label: "Under ₹5,000",
    href: "/browse?maxPricePaise=500000",
    hint: "SSDs, RAM, cabinets and peripherals",
    maxPaise: 500000,
  },
  {
    id: "u20k",
    label: "Under ₹20,000",
    href: "/browse?maxPricePaise=2000000",
    hint: "CPUs, boards and entry GPUs",
    maxPaise: 2000000,
  },
  {
    id: "u50k",
    label: "Under ₹50,000",
    href: "/browse?maxPricePaise=5000000",
    hint: "High-end CPUs and mid-range GPUs",
    maxPaise: 5000000,
  },
] as const;

export default async function Home() {
  const [categories, brandIndex] = await Promise.all([
    listActiveCategories(),
    listBrandFilterIndex(),
  ]);

  const [
    newest,
    trendingPool,
    productsForYou,
    under299,
    under599,
    under999,
    sellers,
  ] = await Promise.all([
    searchApprovedProducts({
      page: 1,
      pageSize: 16,
      sort: "newest",
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 24,
      sort: "newest",
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 12,
      sort: "relevance",
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 500000,
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 2000000,
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 5000000,
      inStockOnly: true,
    }),
    prisma.seller.findMany({
      where: { status: "approved" },
      take: 14,
      orderBy: { tradeName: "asc" },
      select: {
        id: true,
        tradeName: true,
        legalName: true,
        status: true,
        _count: {
          select: { products: { where: { status: "approved" } } },
        },
        products: {
          where: { status: "approved" },
          select: {
            category: { select: { name: true } },
            images: {
              where: { isPrimary: true },
              select: { url: true },
              take: 1,
            },
          },
          take: 8,
        },
      },
    }),
  ]);

  const usedIds = new Set<string>();
  function takeUnique<
    T extends { id: string; availableQty?: number },
  >(items: T[], count: number) {
    const out: T[] = [];
    for (const item of items) {
      if (usedIds.has(item.id)) continue;
      if ((item.availableQty ?? 0) <= 0) continue;
      usedIds.add(item.id);
      out.push(item);
      if (out.length >= count) break;
    }
    return out;
  }

  let newArrivals = takeUnique(newest.items, 5);
  if (newArrivals.length < 5) {
    const fill = await searchApprovedProducts({
      page: 1,
      pageSize: 24,
      sort: "relevance",
      inStockOnly: true,
    });
    newArrivals = [
      ...newArrivals,
      ...takeUnique(fill.items, 5 - newArrivals.length),
    ];
  }

  let trending = takeUnique(trendingPool.items, 18);
  if (trending.length < 12) {
    const extra = await searchApprovedProducts({
      page: 1,
      pageSize: 28,
      sort: "relevance",
      inStockOnly: true,
    });
    trending = [
      ...trending,
      ...takeUnique(
        extra.items.filter((item) => !usedIds.has(item.id)),
        18 - trending.length,
      ),
    ];
  }

  const priceCollections = PRICE_COLLECTIONS.filter((collection) => {
    if (collection.maxPaise === 500000) return under299.total > 0;
    if (collection.maxPaise === 2000000) return under599.total > 0;
    return under999.total > 0;
  }).map(({ id, label, href, hint }) => ({ id, label, href, hint }));

  return (
    <div className="flex flex-col">
      {/* Beat 1 — Hero owns viewport 1 */}
      <AsperaHero />

      {/* Beat 2 — Shop categories */}
      <ShopByCategory categories={[...ASPERA_CATEGORY_TILES]} />

      {/* Beat 3 — Build lanes */}
      <BuildLanes lanes={[...BUILD_LANES]} />

      {/* Beat 4 — Budget + brands */}
      <PriceLedCollections collections={[...priceCollections]} />
      <div className="hidden md:block">
        <ShopByBrands brands={[...ASPERA_BRAND_LANES]} />
      </div>

      {/* Beat 5 — New / trending */}
      {newArrivals.length > 0 ? (
        <section className="border-t border-border/70 bg-background">
          <div className="container-shell flex flex-col gap-3 py-5 md:gap-3.5 md:py-6">
            <SectionHeading
              title="New arrivals"
              description="Recently listed PC components"
              action={
                <Link
                  href="/shop?sort=newest"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  See all →
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
              {newArrivals.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {trending.length > 0 ? (
        <section className="border-t border-border/70 bg-background">
          <div className="container-shell flex flex-col gap-3 py-5 md:gap-3.5 md:py-6">
            <SectionHeading
              title="Trending builds"
              description="Popular parts from the live catalogue"
              action={
                <Link
                  href="/browse"
                  className="text-sm font-medium text-accent hover:underline"
                >
                  See all →
                </Link>
              }
            />
            <TrendingProductsRail products={trending} />
          </div>
        </section>
      ) : null}

      {productsForYou.items.length > 0 ? (
        <section id="products-for-you" className="border-t border-border/70 bg-background">
          <div className="container-shell py-5 md:py-7">
            <CatalogueBrowse
              variant="home"
              heading="More for your build"
              browseBasePath="/browse"
              initialItems={productsForYou.items as BrowseProduct[]}
              initialQuery=""
              initialTotal={productsForYou.total}
              initialSort="relevance"
              categories={categories.map((category) => ({
                slug: category.slug,
                name: category.name,
                productCount: category.productCount,
              }))}
              brands={brandIndex.all}
              brandsByCategory={brandIndex.byCategory}
              enableLoadMore
              infiniteScroll
              updateUrl={false}
            />
          </div>
        </section>
      ) : null}

      {/* Beat 6 — Seller trust */}
      <div className="hidden md:block">
        <FeaturedSellers
          sellers={sellers
            .filter((seller) => seller._count.products > 0)
            .map((seller) => {
              const name = seller.tradeName ?? seller.legalName;
              const categoryCounts = new Map<string, number>();
              for (const product of seller.products) {
                const cat = product.category.name;
                categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
              }
              let topCategory: string | undefined;
              let topCount = 0;
              for (const [cat, count] of categoryCounts) {
                if (count > topCount) {
                  topCategory = cat;
                  topCount = count;
                }
              }
              const imageUrl =
                seller.products.find((p) => p.images[0]?.url)?.images[0]?.url ??
                null;
              return {
                id: seller.id,
                name,
                href: `/shops/${encodeURIComponent(slugify(name))}`,
                productCount: seller._count.products,
                categoryLabel: topCategory,
                statusLabel:
                  seller.status === "approved" ? "Approved seller" : undefined,
                imageUrl,
              };
            })}
        />
      </div>

      <SellerConversionSection />
    </div>
  );
}
