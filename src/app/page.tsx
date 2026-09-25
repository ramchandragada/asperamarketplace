import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { PageShell, SectionHeading } from "@/components/ui/page-shell";
import {
  listActiveCategories,
  searchApprovedProducts,
} from "@/modules/catalogue/service";
import { getOptionalActor } from "@/modules/identity/service";
import { prisma } from "@/platform/db/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [actor, catalogue, categories, approvedSellerCount] = await Promise.all([
    getOptionalActor(),
    searchApprovedProducts({ page: 1, pageSize: 8, sort: "newest" }),
    listActiveCategories(),
    prisma.seller.count({ where: { status: "approved" } }),
  ]);

  const deals = catalogue.items
    .filter(
      (item) =>
        item.minMrpPaise != null && item.minMrpPaise > item.minPricePaise,
    )
    .slice(0, 8);

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
              Shop verified Indian sellers with clear prices and calm checkout.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 opacity-90">
              Discover moderated listings, transparent delivery at checkout, and
              seller trust signals grounded in KYC status—not marketing badges.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="inline-flex rounded-[var(--radius-sm)] bg-surface px-5 py-2.5 text-sm font-semibold text-accent"
              >
                Browse catalogue
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
                Secure session checkout · Server-priced cart · Mock payments in
                non-production
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="Categories"
          title="Shop by category"
          description="Focused launch catalogue with room to expand without rewriting the core."
          action={
            <Link href="/browse" className="text-sm font-medium text-accent underline">
              View all
            </Link>
          }
        />
        <div className="rail-scroll md:grid md:grid-cols-4 md:overflow-visible">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/browse?categorySlug=${encodeURIComponent(category.slug)}`}
              className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold">{category.name}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {category.description ?? "Browse approved listings in this category."}
              </p>
            </Link>
          ))}
          {categories.length === 0 ? (
            <p className="text-sm text-muted">Categories appear after seeding.</p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          eyebrow="Trending"
          title="Fresh from moderated sellers"
          description="Prices and stock are computed on the server in paise."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {catalogue.items.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
        {catalogue.items.length === 0 ? (
          <p className="text-sm text-muted">
            No approved products yet. Seed the non-production database to explore.
          </p>
        ) : null}
      </section>

      {deals.length > 0 ? (
        <section className="flex flex-col gap-5">
          <SectionHeading
            eyebrow="Value"
            title="Marked below MRP"
            description="Discount shown only when MRP is higher than selling price."
          />
          <div className="rail-scroll">
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
              Trust built from KYC status, not slogans
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
              “Verified seller” means the seller profile is approved in this
              environment after KYC review. It is not a legal or tax endorsement.
              GST and tax configuration remain open assumptions (A-24).
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
