import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ProductLoopRail } from "@/components/product-loop-rail";
import { PageShell, SectionHeading } from "@/components/ui/page-shell";
import {
  AsperaHero,
  CampaignTiles,
  FeaturedSellers,
  PriceLedCollections,
  SellerConversionSection,
  ShopByCategory,
  TrustSignalBar,
} from "@/components/home-storefront";
import {
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { slugify } from "@/modules/catalogue/helpers";
import { ASPERA_CATEGORY_TILES } from "@/lib/mega-menu";

export const dynamic = "force-dynamic";

const CAMPAIGN_TILES = [
  {
    id: "essentials",
    title: "Everyday essentials",
    subtitle: "Home and household picks",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
    categorySlug: "home-kitchen",
  },
  {
    id: "festive",
    title: "Festive fashion",
    subtitle: "Ethnic and occasion wear",
    href: "/browse?categorySlug=fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    categorySlug: "fashion",
  },
  {
    id: "wellness",
    title: "Wellness picks",
    subtitle: "Beauty and personal care",
    href: "/browse?categorySlug=beauty-personal-care",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80",
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
      pageSize: 10,
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
      take: 10,
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

  const newArrivals = takeUnique(newest.items, 10);

  const priceCollections = PRICE_COLLECTIONS.filter((collection) => {
    if (collection.maxPaise === 29900) return under299.total > 0;
    if (collection.maxPaise === 59900) return under599.total > 0;
    return under999.total > 0;
  }).map(({ id, label, href, hint }) => ({ id, label, href, hint }));

  return (
    <div className="flex flex-col">
      <AsperaHero />
      <TrustSignalBar />
      <ShopByCategory categories={[...ASPERA_CATEGORY_TILES]} />
      <CampaignTiles tiles={campaignTiles} />

      {trending.length > 0 ? (
        <section className="container-shell flex flex-col gap-4 py-8 md:py-12">
          <SectionHeading
            title="Trending products"
            description="Fresh picks shoppers are exploring"
            action={
              <Link
                href="/popular"
                className="text-sm font-medium text-accent hover:underline"
              >
                See all →
              </Link>
            }
          />
          <ProductLoopRail
            items={trending}
            label="Trending products"
            renderItem={(item) => <ProductCard product={item} />}
          />
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
        <PageShell className="gap-4 !pt-4 !pb-4">
          <section className="flex flex-col gap-4">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {newArrivals.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        </PageShell>
      ) : null}

      <SellerConversionSection />
    </div>
  );
}
