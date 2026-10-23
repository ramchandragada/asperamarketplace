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
  AsperaSelectsBanner,
  CampaignTiles,
  DiscoveryPromoBanner,
  FeaturedSellers,
  PriceLedCollections,
  SellerConversionSection,
  ShopByBrands,
  ShopByCategory,
  TrustSignalBar,
} from "@/components/home-storefront";
import {
  listActiveBrands,
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { slugify } from "@/modules/catalogue/helpers";
import { ASPERA_BRAND_LANES, ASPERA_CATEGORY_TILES } from "@/lib/mega-menu";

export const dynamic = "force-dynamic";

/** Split promo lanes — tall collection cards (Meesho-style discovery) */
const DISCOVERY_LANES = [
  {
    id: "graphics",
    label: "Graphics cards",
    href: "/browse?categorySlug=graphics-cards",
    imageUrl: "/hero/pc-gpu.jpg",
  },
  {
    id: "budget",
    label: "Budget builds",
    href: "/browse?maxPricePaise=1500000",
    imageUrl: "/hero/pc-build.jpg",
  },
  {
    id: "setup",
    label: "Monitors & desk",
    href: "/browse?categorySlug=monitors",
    imageUrl: "/hero/pc-desk.jpg",
  },
  {
    id: "new",
    label: "New arrivals",
    href: "/shop?sort=newest",
    imageUrl: "/hero/pc-setup.jpg",
  },
] as const;

/** Aspera Selects — arched lifestyle tiles (Indian faces & ethnic wear) */
const SELECT_TILES = [
  {
    id: "processors",
    label: "Processors",
    href: "/browse?categorySlug=processors",
    imageUrl: "/hero/pc-build.jpg",
  },
  {
    id: "graphics",
    label: "Graphics cards",
    href: "/browse?categorySlug=graphics-cards",
    imageUrl: "/hero/pc-gpu.jpg",
  },
  {
    id: "monitors",
    label: "Monitors",
    href: "/browse?categorySlug=monitors",
    imageUrl: "/hero/pc-desk.jpg",
  },
  {
    id: "ssd",
    label: "SSD / Storage",
    href: "/browse?categorySlug=storage-ssd",
    imageUrl: "/hero/pc-setup.jpg",
  },
] as const;

const CAMPAIGN_TILES = [
  {
    id: "gaming",
    title: "Build a gaming PC",
    subtitle: "GPUs, CPUs and cabinets",
    href: "/browse?categorySlug=graphics-cards",
    imageUrl: "/hero/pc-gpu.jpg",
    categorySlug: "graphics-cards",
  },
  {
    id: "workspace",
    title: "Upgrade your workspace",
    subtitle: "Monitors, keyboards and mice",
    href: "/browse?categorySlug=monitors",
    imageUrl: "/hero/pc-desk.jpg",
    categorySlug: "monitors",
  },
  {
    id: "storage",
    title: "Storage & power",
    subtitle: "SSDs and UPS backup",
    href: "/browse?categorySlug=storage-ssd",
    imageUrl: "/hero/pc-setup.jpg",
    categorySlug: "storage-ssd",
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
  const [categories, brands] = await Promise.all([
    listActiveCategories(),
    listActiveBrands(),
  ]);
  const categorySlugSet = new Set(categories.map((c) => c.slug));

  const campaignTiles = CAMPAIGN_TILES.filter((tile) =>
    categorySlugSet.has(tile.categorySlug),
  ).map(({ id, title, subtitle, href, imageUrl }) => ({
    id,
    title,
    subtitle,
    href,
    imageUrl,
  }));

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
      categorySlug: categorySlugSet.has("fashion") ? "fashion" : undefined,
    }),
    searchApprovedProducts({
      // Smaller first batch keeps the mobile home shorter; the "Products For
      // You" feed uses infinite scroll, so more load as the shopper scrolls.
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

  // Deduplicate products across homepage rails; never merchandising OOS SKUs
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

  // Reserve new arrivals first so the rail always fills a full row of five
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
      <AsperaHero />
      <TrustSignalBar />
      <DiscoveryPromoBanner lanes={[...DISCOVERY_LANES]} />
      {/* Secondary merchandising: desktop/tablet only, so the mobile home
          reaches products sooner. */}
      <div className="hidden md:block">
        <AsperaSelectsBanner tiles={[...SELECT_TILES]} />
      </div>
      <ShopByCategory categories={[...ASPERA_CATEGORY_TILES]} />
      <div className="hidden md:block">
        <ShopByBrands brands={[...ASPERA_BRAND_LANES]} />
      </div>
      <div className="hidden md:block">
        <CampaignTiles tiles={campaignTiles} />
      </div>

      {trending.length > 0 ? (
        <section className="studio-band">
          <div className="container-shell flex flex-col gap-3 py-5 md:gap-3.5 md:py-6">
          <SectionHeading
            title="Picked for you"
            description="Personalised finds from live catalogue"
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

      <div className="hidden md:block">
        <PriceLedCollections collections={[...priceCollections]} />
      </div>

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

      {newArrivals.length > 0 ? (
        <section className="studio-band">
          <div className="container-shell flex flex-col gap-3 py-5 md:gap-3.5 md:py-6">
          <SectionHeading
            title="New arrivals"
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

      {/* Added below existing merchandising — does not replace any prior section */}
      {productsForYou.items.length > 0 ? (
        <section
          id="products-for-you"
          className="bg-background"
        >
          <div className="container-shell py-5 md:py-7">
            <CatalogueBrowse
              variant="home"
              heading="Products For You"
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
              brands={brands}
              enableLoadMore
              infiniteScroll
              updateUrl={false}
            />
          </div>
        </section>
      ) : null}

      <SellerConversionSection />
    </div>
  );
}
