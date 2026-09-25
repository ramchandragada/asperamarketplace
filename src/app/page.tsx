import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import {
  CatalogueBrowse,
  type BrowseProduct,
} from "@/components/catalogue-browse";
import { AsperaGoldSection } from "@/components/aspera-gold-section";
import { BankOffersStrip } from "@/components/bank-offers-strip";
import { PageShell, SectionHeading } from "@/components/ui/page-shell";
import {
  CategoryCircles,
  HeroCarousel,
  OriginalBrandsSection,
  PromoBanner,
  SellerLogoStrip,
  TrustSignalBar,
} from "@/components/home-storefront";
import {
  listActiveBrands,
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { prisma } from "@/platform/db/prisma";
import { SEED_CATEGORIES } from "@/modules/catalogue/seed-catalogue-data";
import { discountPercent, slugify } from "@/modules/catalogue/helpers";

export const dynamic = "force-dynamic";

const HERO_BUBBLES = {
  ethnic: [
    {
      label: "Sarees",
      href: "/browse?categorySlug=fashion&q=saree",
      imageUrl:
        "https://images.unsplash.com/photo-1610030469983-98e550d85b9a?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Lehengas",
      href: "/browse?categorySlug=fashion&q=lehenga",
      imageUrl:
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Kurtis",
      href: "/browse?categorySlug=fashion&q=kurta",
      imageUrl:
        "https://images.unsplash.com/photo-1583391733956-375ff8d0a9fc?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Jewellery",
      href: "/browse?q=jewellery",
      imageUrl:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=400&q=80",
    },
  ],
  men: [
    {
      label: "Menwear",
      href: "/browse?categorySlug=fashion&q=shirt",
      imageUrl:
        "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Footwear",
      href: "/browse?categorySlug=bags-footwear",
      imageUrl:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Watches",
      href: "/browse?categorySlug=electronics-accessories&q=watch",
      imageUrl:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Bags",
      href: "/browse?categorySlug=bags-footwear&q=backpack",
      imageUrl:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
    },
  ],
  home: [
    {
      label: "Kitchen",
      href: "/browse?categorySlug=home-kitchen",
      imageUrl:
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Decor",
      href: "/browse?categorySlug=home-kitchen&q=cushion",
      imageUrl:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Cleaning",
      href: "/browse?categorySlug=household-essentials",
      imageUrl:
        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Storage",
      href: "/browse?categorySlug=home-kitchen&q=container",
      imageUrl:
        "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=400&q=80",
    },
  ],
  beauty: [
    {
      label: "Skincare",
      href: "/browse?categorySlug=beauty-personal-care&q=face",
      imageUrl:
        "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Makeup",
      href: "/browse?categorySlug=beauty-personal-care&q=lip",
      imageUrl:
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Haircare",
      href: "/browse?categorySlug=beauty-personal-care&q=oil",
      imageUrl:
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=400&q=80",
    },
    {
      label: "Wellness",
      href: "/browse?categorySlug=health-wellness",
      imageUrl:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80",
    },
  ],
} as const;

const HERO_SLIDES = [
  {
    id: "aspera-gold",
    eyebrow: "Aspera Gold",
    title: "Festive favourites from ₹299",
    subtitle:
      "Sarees, lehengas, kurtis & jewellery — trusted sellers, easy returns.",
    ctaLabel: "Shop Now",
    href: "/browse?categorySlug=fashion&q=kurta",
    imageUrl:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Festive ethnic fashion campaign",
    tone: "gold" as const,
    bubbles: [...HERO_BUBBLES.ethnic],
  },
  {
    id: "men-edit",
    eyebrow: "Men's edit",
    title: "Everyday essentials that work overtime",
    subtitle: "Shirts, sneakers, watches & bags for the week ahead.",
    ctaLabel: "Shop Now",
    href: "/browse?categorySlug=fashion&q=shirt",
    imageUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Men fashion and accessories",
    tone: "teal" as const,
    bubbles: [...HERO_BUBBLES.men],
  },
  {
    id: "home-refresh",
    eyebrow: "Home refresh",
    title: "Upgrade your kitchen & living space",
    subtitle: "Cookware, storage and décor picks under ₹999.",
    ctaLabel: "Shop Now",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Bright modern kitchen lifestyle",
    tone: "orange" as const,
    bubbles: [...HERO_BUBBLES.home],
  },
  {
    id: "beauty-glow",
    eyebrow: "Beauty & wellness",
    title: "Glow for less — daily care staples",
    subtitle: "Skincare, makeup and wellness from verified sellers.",
    ctaLabel: "Shop Now",
    href: "/browse?categorySlug=beauty-personal-care",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Beauty products campaign flat lay",
    tone: "magenta" as const,
    bubbles: [...HERO_BUBBLES.beauty],
  },
];

const ORIGINAL_BRAND_CARDS = [
  {
    id: "personal-care",
    label: "Personal Care",
    href: "/browse?categorySlug=beauty-personal-care",
    imageUrl:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(26, 92, 92, 0.92)",
  },
  {
    id: "electronics",
    label: "Electronics",
    href: "/browse?categorySlug=electronics-accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(76, 29, 149, 0.9)",
  },
  {
    id: "makeup",
    label: "Makeup",
    href: "/browse?categorySlug=beauty-personal-care&q=lip",
    imageUrl:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(157, 23, 77, 0.9)",
  },
  {
    id: "smart-phones",
    label: "Smart Phones",
    href: "/browse?categorySlug=mobile-accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(30, 58, 138, 0.92)",
  },
  {
    id: "men-perfume",
    label: "Men Perfume",
    href: "/browse?categorySlug=beauty-personal-care&q=perfume",
    imageUrl:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(120, 53, 15, 0.92)",
  },
  {
    id: "home-appliances",
    label: "Home Essentials",
    href: "/browse?categorySlug=home-kitchen",
    imageUrl:
      "https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(232, 131, 58, 0.92)",
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    href: "/browse?categorySlug=sports-fitness",
    imageUrl:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(15, 118, 110, 0.92)",
  },
  {
    id: "fashion",
    label: "Fashion",
    href: "/browse?categorySlug=fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    overlay: "rgba(190, 24, 93, 0.9)",
  },
];

const BRAND_LOGOS = [
  { id: "narmada", name: "Narmada Weave", mark: "NW", href: "/browse?q=narmada" },
  { id: "coastal", name: "Coastal Bloom", mark: "CB", href: "/browse?q=coastal" },
  { id: "silicon", name: "Silicon Bay", mark: "SB", href: "/browse?q=silicon" },
  { id: "pulse", name: "Pulse Fit", mark: "PF", href: "/browse?q=pulse" },
  { id: "lotus", name: "Little Lotus", mark: "LL", href: "/browse?q=lotus" },
  { id: "quill", name: "Ink & Quill", mark: "IQ", href: "/browse?q=quill" },
  { id: "trail", name: "Trailmark", mark: "TM", href: "/browse?q=trailmark" },
  { id: "aspera-home", name: "Aspera Home", mark: "AH", href: "/browse?q=aspera%20home" },
];

export default async function Home() {
  const categories = await listActiveCategories();
  const categorySlugs = categories.map((category) => category.slug);

  const [newest, trendingPool, dealsPool, forYou, sellers, brands] =
    await Promise.all([
    searchApprovedProducts({ page: 1, pageSize: 8, sort: "newest" }),
    searchApprovedProducts({
      page: 1,
      pageSize: 12,
      sort: "newest",
      categorySlug: categorySlugs.find((slug) => slug === "fashion") ?? undefined,
    }),
    searchApprovedProducts({ page: 1, pageSize: 40, sort: "newest" }),
    searchApprovedProducts({ page: 1, pageSize: 24, sort: "relevance" }),
    prisma.seller.findMany({
      where: { status: "approved" },
      take: 12,
      orderBy: { tradeName: "asc" },
      select: {
        id: true,
        tradeName: true,
        legalName: true,
        _count: {
          select: { products: { where: { status: "approved" } } },
        },
        products: {
          where: { status: "approved" },
          select: { attributes: true },
          take: 48,
        },
      },
    }),
    listActiveBrands(),
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
      <BankOffersStrip />
      <CategoryCircles categories={circleCategories} />
      <AsperaGoldSection />
      <OriginalBrandsSection cards={ORIGINAL_BRAND_CARDS} logos={BRAND_LOGOS} />
      <PromoBanner
        imageUrl="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
        categories={circleCategories}
      />
      <SellerLogoStrip
        sellers={sellers.map((seller) => {
          const name = seller.tradeName ?? seller.legalName;
          const ratings = seller.products
            .map((product) => {
              const attrs =
                product.attributes &&
                typeof product.attributes === "object" &&
                !Array.isArray(product.attributes)
                  ? (product.attributes as Record<string, unknown>)
                  : {};
              return typeof attrs.ratingAverage === "number"
                ? attrs.ratingAverage
                : null;
            })
            .filter((value): value is number => value != null);
          const ratingAverage =
            ratings.length > 0
              ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
              : 4.0;
          return {
            id: seller.id,
            name,
            href: `/shops/${encodeURIComponent(slugify(name))}`,
            productCount: seller._count.products,
            ratingAverage: Number(ratingAverage.toFixed(1)),
          };
        })}
      />

      <PageShell className="gap-10 md:gap-12 !pt-4 !pb-4">
        <section className="flex flex-col gap-4">
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
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {newest.items.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading
            title="Popular picks"
            description="Best sellers across categories"
            action={
              <Link
                href="/popular"
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
          <section className="flex flex-col gap-4">
            <SectionHeading
              title="Deals of the day"
              description="Today's best deals"
              action={
                <Link
                  href="/shop?minDiscountPercent=15"
                  className="text-sm font-medium text-accent underline"
                >
                  See all →
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {deals.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[var(--radius)] border border-border bg-accent-soft p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold md:text-2xl">
                Become a Supplier
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                Sell across India with verified listings and transparent pricing.
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

      <div className="border-t border-border bg-background py-8 md:py-10">
        <div className="container-shell">
          <CatalogueBrowse
            initialItems={forYouItems as BrowseProduct[]}
            initialQuery=""
            initialTotal={forYou.total}
            categories={categories.map((category) => ({
              slug: category.slug,
              name: category.name,
              productCount: category.productCount,
            }))}
            brands={brands}
            initialSort="relevance"
            heading="Products For You"
            browseBasePath="/"
            variant="home"
            enableLoadMore
            infiniteScroll
            updateUrl={false}
          />
        </div>
      </div>
    </div>
  );
}
