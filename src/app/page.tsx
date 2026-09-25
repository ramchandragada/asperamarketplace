import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { PageShell, SectionHeading } from "@/components/ui/page-shell";
import {
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";
import { SEED_CATEGORIES } from "@/modules/catalogue/seed-catalogue-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [actor, catalogue, newest, dealsSource, categories, approvedSellerCount] =
    await Promise.all([
      getOptionalActor(),
      searchApprovedProducts({ page: 1, pageSize: 12, sort: "newest" }),
      searchApprovedProducts({ page: 1, pageSize: 8, sort: "newest" }),
      searchApprovedProducts({ page: 1, pageSize: 24, sort: "newest" }),
      listActiveCategories(),
      prisma.seller.count({ where: { status: "approved" } }),
    ]);

  const deals = dealsSource.items
    .filter(
      (item) =>
        item.minMrpPaise != null && item.minMrpPaise > item.minPricePaise,
    )
    .slice(0, 8);

  const categoryVisual = Object.fromEntries(
    SEED_CATEGORIES.map((category) => [category.slug, category.imagePool[0]]),
  );

  return (
    <PageShell className="gap-12 md:gap-16">
      <section className="relative overflow-hidden rounded-[calc(var(--radius)+4px)] border border-border bg-accent text-accent-foreground shadow-[var(--shadow-soft)]">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.35), transparent 40%), linear-gradient(135deg, rgba(0,0,0,0.15), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative grid gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr] md:px-10 md:py-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-90">
              Aspera Marketplace
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight md:text-5xl">
              A richer catalogue from verified Indian sellers.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 opacity-90">
              Browse image-led product cards, transparent prices, and server-priced
              checkout. Seed listings are fictional development data for preview.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="inline-flex rounded-[var(--radius-sm)] bg-surface px-5 py-2.5 text-sm font-semibold text-accent"
              >
                Shop the catalogue
              </Link>
              <Link
                href={actor ? "/seller" : "/seller/onboarding"}
                className="inline-flex rounded-[var(--radius-sm)] border border-accent-foreground/30 px-5 py-2.5 text-sm font-medium"
              >
                Sell on Aspera
              </Link>
            </div>
          </div>
          <div className="grid gap-3 self-end sm:grid-cols-2">
            <div className="rounded-[var(--radius-sm)] bg-black/15 p-4 backdrop-blur-sm">
              <p className="text-3xl font-semibold">{catalogue.total}</p>
              <p className="text-sm opacity-90">Approved listings</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-black/15 p-4 backdrop-blur-sm">
              <p className="text-3xl font-semibold">{approvedSellerCount}</p>
              <p className="text-sm opacity-90">Approved sellers</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-black/15 p-4 backdrop-blur-sm sm:col-span-2">
              <p className="text-sm leading-6 opacity-90">
                Secure session checkout · Mock payments in non-production · A-24 tax
                assumptions remain open
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="Categories"
          title="Shop by category"
          description="Twelve India-focused categories seeded for discovery, filters, and seller distribution."
          action={
            <Link href="/browse" className="text-sm font-medium text-accent underline">
              View all
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => {
            const image = categoryVisual[category.slug];
            return (
              <Link
                key={category.id}
                href={`/browse?categorySlug=${encodeURIComponent(category.slug)}`}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]"
              >
                <div className="relative aspect-[5/4] bg-accent-soft">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover transition group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold">{category.name}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="New arrivals"
          title="Fresh from moderated sellers"
          description="Newest approved listings with server-side prices in paise."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {newest.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="Trending"
          title="Popular picks across categories"
          description="Curated from the seeded catalogue for visual density—not live popularity scores."
        />
        <div className="rail-scroll">
          {catalogue.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>

      {deals.length > 0 ? (
        <section className="flex flex-col gap-5">
          <SectionHeading
            eyebrow="Deals"
            title="Marked below MRP"
            description="Discount shown only when MRP is higher than selling price."
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {deals.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-border bg-surface-raised p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge tone="success">Seller verification</Badge>
            <h2 className="mt-3 text-2xl font-semibold">
              Products from multiple approved sellers
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              Catalogue seed distributes listings across home, fashion, tech, and
              wellness demo sellers. “Verified seller” means approved KYC status in
              this environment—not a legal endorsement.
            </p>
          </div>
          <Link
            href="/seller/onboarding"
            className="inline-flex rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Start seller onboarding
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
