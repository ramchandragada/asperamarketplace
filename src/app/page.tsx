import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { PageShell, SectionHeading } from "@/components/ui/page-shell";
import {
  CategoryCircles,
  HeroCarousel,
  PromoBanner,
  SellerLogoStrip,
  TrustSignalBar,
} from "@/components/home-storefront";
import {
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { SEED_CATEGORIES } from "@/modules/catalogue/seed-catalogue-data";
import { discountPercent } from "@/modules/catalogue/helpers";

export const dynamic = "force-dynamic";

const HERO_SLIDES = [
  {
    id: "fashion",
    eyebrow: "New season",
    title: "New season arrivals — up to 40% off",
    ctaLabel: "Shop now",
    href: "/browse?categorySlug=fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Fashion apparel on racks",
  },
  {
    id: "electronics",
    eyebrow: "Tech deals",
    title: "Top deals on gadgets & accessories",
    ctaLabel: "Explore",
    href: "/browse?categorySlug=electronics-accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Headphones and electronics",
  },
  {
    id: "home",
    eyebrow: "Home refresh",
    title: "Transform your space — kitchen & home essentials",
    ctaLabel: "Browse",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Modern kitchen interior",
  },
  {
    id: "beauty",
    eyebrow: "Beauty picks",
    title: "Glow for less — beauty & personal care",
    ctaLabel: "Shop beauty",
    href: "/browse?categorySlug=beauty-personal-care",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=80",
    imageAlt: "Beauty products flat lay",
  },
];

export default async function Home() {
  const categories = await listActiveCategories();
  const categorySlugs = categories.map((category) => category.slug);

  const [newest, trendingPool, dealsPool, forYou, sellers] = await Promise.all([
    searchApprovedProducts({ page: 1, pageSize: 8, sort: "newest" }),
    searchApprovedProducts({
      page: 1,
      pageSize: 12,
      sort: "newest",
      categorySlug: categorySlugs.find((slug) => slug === "fashion") ?? undefined,
    }),
    searchApprovedProducts({ page: 1, pageSize: 40, sort: "newest" }),
    searchApprovedProducts({ page: 1, pageSize: 24, sort: "newest" }),
    prisma.seller.findMany({
      where: { status: "approved" },
      take: 12,
      orderBy: { tradeName: "asc" },
      select: { id: true, tradeName: true, legalName: true },
    }),
  ]);

  // Diversify trending away from newest household-heavy first page
  let trending = trendingPool.items;
  if (trending.length < 8) {
    const tech = await searchApprovedProducts({
      page: 1,
      pageSize: 12,
      sort: "newest",
      categorySlug: "electronics-accessories",
    });
    const beauty = await searchApprovedProducts({
      page: 1,
      pageSize: 12,
      sort: "newest",
      categorySlug: "beauty-personal-care",
    });
    const seen = new Set(trending.map((item) => item.id));
    for (const item of [...tech.items, ...beauty.items, ...dealsPool.items]) {
      if (!seen.has(item.id)) {
        trending.push(item);
        seen.add(item.id);
      }
      if (trending.length >= 12) break;
    }
  }

  const newestIds = new Set(newest.items.map((item) => item.id));
  trending = trending.filter((item) => !newestIds.has(item.id)).slice(0, 12);

  const deals = dealsPool.items
    .map((item) => ({
      item,
      discount: discountPercent(item.minMrpPaise ?? 0, item.minPricePaise) ?? 0,
    }))
    .filter((entry) => entry.discount >= 15)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 8)
    .map((entry) => entry.item);

  const categoryVisual = Object.fromEntries(
    SEED_CATEGORIES.map((category) => [category.slug, category.imagePool[0]]),
  );

  const circleCategories = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    imageUrl: categoryVisual[category.slug] ?? null,
  }));

  // Stable shuffle for "Products for you" using published order offset
  const forYouItems = [...forYou.items].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return (
    <div className="flex flex-col">
      <HeroCarousel slides={HERO_SLIDES} />
      <TrustSignalBar />
      <CategoryCircles categories={circleCategories} />
      <PromoBanner
        imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
        categories={circleCategories}
      />
      <SellerLogoStrip
        sellers={sellers.map((seller) => ({
          id: seller.id,
          name: seller.tradeName ?? seller.legalName,
          href: `/browse?q=${encodeURIComponent(seller.tradeName ?? seller.legalName)}`,
        }))}
      />

      <PageShell className="gap-12 md:gap-14 !pt-4">
        <section className="flex flex-col gap-5">
          <SectionHeading
            title="New arrivals"
            description="Just landed on Aspera"
            action={
              <Link
                href="/shop?sort=newest"
                className="text-sm font-medium text-accent underline"
              >
                See all →
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {newest.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <SectionHeading
            title="Popular picks"
            description="Best sellers across categories"
            action={
              <Link
                href="/browse?categorySlug=fashion"
                className="text-sm font-medium text-accent underline"
              >
                See all →
              </Link>
            }
          />
          <div className="rail-scroll">
            {trending.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        {deals.length > 0 ? (
          <section className="flex flex-col gap-5">
            <SectionHeading
              title="Deals of the day"
              description="Today's best deals"
              action={
                <Link href="/shop" className="text-sm font-medium text-accent underline">
                  See all →
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {deals.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-col gap-5">
          <SectionHeading
            title="Products for you"
            description="Keep browsing — fresh picks every scroll"
            action={
              <Link href="/shop" className="text-sm font-medium text-accent underline">
                See all →
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {forYouItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex rounded-[var(--radius-sm)] border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Load more on Shop
            </Link>
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-accent-soft p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">
                Sell on Aspera
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Reach shoppers across India with verified listings and transparent
                pricing.
              </p>
            </div>
            <Link
              href="/seller/onboarding"
              className="inline-flex rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              Start selling
            </Link>
          </div>
        </section>
      </PageShell>
    </div>
  );
}
