import Link from "next/link";
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
    id: "trending",
    label: "Trending now",
    href: "/popular",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "budget",
    label: "Budget buys",
    href: "/browse?maxPricePaise=59900",
    imageUrl:
      "https://images.unsplash.com/photo-1589169011402-8b2cbd1ee593?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "rated",
    label: "Top rated picks",
    href: "/browse?sort=relevance",
    imageUrl:
      "https://images.unsplash.com/photo-1534235187448-833893dfe3e0?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "essentials",
    label: "Daily essentials",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1659352790654-058e9077a4f4?auto=format&fit=crop&w=800&q=85",
  },
] as const;

/** Aspera Selects — arched lifestyle tiles (Indian faces & ethnic wear) */
const SELECT_TILES = [
  {
    id: "lehengas",
    label: "Lehengas",
    href: "/browse?categorySlug=fashion&q=lehenga&audience=women",
    imageUrl:
      "https://images.unsplash.com/photo-1633891119630-cb3665df5b7d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "menwear",
    label: "Menwear",
    href: "/browse?categorySlug=fashion&audience=men",
    imageUrl:
      "https://images.unsplash.com/photo-1534235187448-833893dfe3e0?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "sarees",
    label: "Sarees",
    href: "/browse?categorySlug=fashion&q=saree&audience=women",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "jewellery",
    label: "Jewellery",
    href: "/browse?categorySlug=fashion&q=jewellery&audience=women",
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=85",
  },
] as const;

const CAMPAIGN_TILES = [
  {
    id: "essentials",
    title: "Everyday essentials",
    subtitle: "Home and household picks",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=85",
    categorySlug: "home-kitchen",
  },
  {
    id: "festive",
    title: "Festive fashion",
    subtitle: "Ethnic and occasion wear",
    href: "/browse?categorySlug=fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1633891119630-cb3665df5b7d?auto=format&fit=crop&w=1200&q=85",
    categorySlug: "fashion",
  },
  {
    id: "wellness",
    title: "Wellness picks",
    subtitle: "Beauty and personal care",
    href: "/browse?categorySlug=beauty-personal-care",
    imageUrl:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=85",
    categorySlug: "beauty-personal-care",
  },
] as const;

const PRICE_COLLECTIONS = [
  {
    id: "u299",
    label: "Under ₹299",
    href: "/browse?maxPricePaise=29900",
    hint: "Budget finds for everyday needs",
    maxPaise: 29900,
  },
  {
    id: "u599",
    label: "Under ₹599",
    href: "/browse?maxPricePaise=59900",
    hint: "Value picks across categories",
    maxPaise: 59900,
  },
  {
    id: "u999",
    label: "Under ₹999",
    href: "/browse?maxPricePaise=99900",
    hint: "Smart upgrades under a thousand",
    maxPaise: 99900,
  },
] as const;

export default async function Home() {
  const categories = await listActiveCategories();
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
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 29900,
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 59900,
      inStockOnly: true,
    }),
    searchApprovedProducts({
      page: 1,
      pageSize: 4,
      sort: "price_asc",
      maxPricePaise: 99900,
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
    if (collection.maxPaise === 29900) return under299.total > 0;
    if (collection.maxPaise === 59900) return under599.total > 0;
    return under999.total > 0;
  }).map(({ id, label, href, hint }) => ({ id, label, href, hint }));

  return (
    <div className="flex flex-col">
      <AsperaHero />
      <TrustSignalBar />
      <DiscoveryPromoBanner lanes={[...DISCOVERY_LANES]} />
      <AsperaSelectsBanner tiles={[...SELECT_TILES]} />
      <ShopByCategory categories={[...ASPERA_CATEGORY_TILES]} />
      <ShopByBrands brands={[...ASPERA_BRAND_LANES]} />
      <CampaignTiles tiles={campaignTiles} />

      {trending.length > 0 ? (
        <section className="container-shell flex flex-col gap-3 py-4 md:gap-3.5 md:py-5">
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
        </section>
      ) : null}

      <PriceLedCollections collections={[...priceCollections]} />

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

      {newArrivals.length > 0 ? (
        <section className="container-shell flex flex-col gap-3 py-4 md:gap-3.5 md:py-5">
          <SectionHeading
            title="New arrivals"
            description="Recently listed on Aspera"
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
        </section>
      ) : null}

      <SellerConversionSection />
    </div>
  );
}
