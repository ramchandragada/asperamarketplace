"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties } from "react";
import { ProductLoopRail } from "@/components/product-loop-rail";

function TrustReturnIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8H4a8 8 0 1 1-1.5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 4v4H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustCodIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3 10h18M7 14h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrustPriceIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5c0-1.2.9-2 2.2-2h1.1c1.1 0 1.9.7 1.9 1.7 0 .9-.5 1.4-1.5 1.7l-1.7.5c-1 .3-1.5.8-1.5 1.7 0 1 .9 1.7 2.1 1.7h1c1.3 0 2.2-.8 2.2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5v1.2M12 16.2V17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Honest announcement strip for marketplace chrome */
export function AnnouncementStrip() {
  return (
    <div className="bg-accent text-accent-foreground">
      <p className="container-shell flex h-8 items-center justify-center text-center text-[12px] font-medium tracking-wide md:h-9 md:text-[13px]">
        Free delivery on eligible orders · Easy returns · Secure checkout
      </p>
    </div>
  );
}

/** Original Aspera hero — two-column merchandising, not a Meesho campaign twin */
export function AsperaHero() {
  return (
    <section className="container-shell py-5 md:py-8">
      <div className="grid min-h-[360px] overflow-hidden rounded-2xl border border-border bg-surface md:min-h-[400px] md:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 px-6 py-8 md:gap-5 md:px-10 md:py-12">
          <p className="text-[13px] font-medium tracking-wide text-brand-accent">
            Curated shopping for everyday India
          </p>
          <h1 className="max-w-md text-[32px] leading-[40px] font-bold tracking-tight text-foreground md:text-[40px] md:leading-[48px]">
            Discover more. Choose better.
          </h1>
          <p className="max-w-md text-[14px] leading-[21px] text-muted">
            Products from independent sellers, clear pricing, and simple
            delivery.
          </p>
          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-[14px] font-semibold text-accent-foreground transition hover:bg-[var(--accent-hover)]"
            >
              Explore products
            </Link>
            <Link
              href="/sell"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-[14px] font-semibold text-foreground transition hover:border-accent hover:text-accent"
            >
              Start selling
            </Link>
          </div>
        </div>
        <div className="relative min-h-[220px] bg-[linear-gradient(145deg,#123b4a_0%,#1a4d5e_45%,#e66a3d_100%)] md:min-h-full">
          <div className="absolute inset-0 grid grid-cols-2 gap-3 p-5 md:gap-4 md:p-8">
            <div className="relative col-span-1 row-span-2 overflow-hidden rounded-xl bg-white/10">
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
                alt="Fashion and everyday apparel"
                fill
                sizes="(max-width: 768px) 50vw, 280px"
                className="object-cover"
                priority
              />
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white/10">
              <Image
                src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=600&q=80"
                alt="Home and kitchen essentials"
                fill
                sizes="(max-width: 768px) 40vw, 200px"
                className="object-cover"
                priority
              />
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white/10">
              <Image
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
                alt="Electronics and accessories"
                fill
                sizes="(max-width: 768px) 40vw, 200px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Trust strip using Aspera accent colours — honest service messages only */
export function TrustSignalBar() {
  const items = [
    { label: "Easy returns on eligible orders", Icon: TrustReturnIcon },
    { label: "Cash on delivery available", Icon: TrustCodIcon },
    { label: "Clear prices before you buy", Icon: TrustPriceIcon },
  ];
  return (
    <div className="border-y border-border bg-accent-soft">
      <ul className="container-shell flex flex-wrap items-center justify-center gap-x-1 gap-y-2 py-3 text-[13px] text-foreground md:py-3.5">
        {items.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center gap-2 px-3 text-accent sm:px-6 md:px-8"
          >
            {index > 0 ? (
              <span
                className="mr-2 hidden h-4 w-px bg-border sm:block"
                aria-hidden
              />
            ) : null}
            <item.Icon />
            <span className="font-medium text-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryCircles({
  categories,
}: {
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    imageUrl?: string | null;
  }>;
}) {
  return (
    <section className="container-shell flex flex-col gap-4 py-8 md:py-12">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
          Shop by category
        </h2>
        <Link
          href="/browse"
          className="text-sm font-medium text-accent hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="category-scroll">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/browse?categorySlug=${encodeURIComponent(category.slug)}`}
            className="group flex w-[6.25rem] flex-col items-center gap-2 text-center"
          >
            <span className="relative h-[7.5rem] w-[7.5rem] overflow-hidden rounded-xl border border-border bg-accent-soft transition group-hover:border-accent group-focus-visible:border-accent">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl font-semibold text-accent/40">
                  {category.name.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="line-clamp-2 text-[14px] font-medium leading-5">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Square category tiles — original Aspera shop-by-category */
export function ShopByCategory({
  categories,
}: {
  categories: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
  }>;
}) {
  const tiles = categories.slice(0, 8);

  return (
    <section className="border-b border-border bg-surface">
      <div className="container-shell py-8 md:py-12">
        <div className="mb-5 flex items-end justify-between gap-3 md:mb-6">
          <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
            Shop by category
          </h2>
          <Link
            href="/browse"
            className="text-sm font-medium text-accent hover:underline"
          >
            View all
          </Link>
        </div>
        <ProductLoopRail
          items={tiles}
          label="Shop by category"
          variant="category"
          renderItem={(category) => (
            <Link
              href={category.href}
              className="group flex flex-col items-center gap-2.5 text-center"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-accent-soft transition group-hover:border-accent group-hover:shadow-sm">
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 120px, 160px"
                  className="object-cover object-center"
                />
              </span>
              <span className="text-[14px] font-medium text-foreground md:text-[15px]">
                {category.label}
              </span>
            </Link>
          )}
        />
      </div>
    </section>
  );
}

/** @deprecated Prefer ShopByCategory */
export const CategoryArches = ShopByCategory;

export type CampaignTile = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
};

export function CampaignTiles({ tiles }: { tiles: CampaignTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <section className="container-shell py-8 md:py-12">
      <div className="mb-5 md:mb-6">
        <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
          Featured collections
        </h2>
        <p className="mt-1 text-sm text-muted">
          Curated picks from live catalogue categories
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href}
              className="group relative flex h-[220px] overflow-hidden rounded-2xl border border-border md:h-[260px]"
            >
              <Image
                src={tile.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#123b4a]/85 via-[#123b4a]/25 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5 text-white">
                <span className="block text-[18px] font-bold leading-6">
                  {tile.title}
                </span>
                <span className="mt-1 block text-[13px] text-white/85">
                  {tile.subtitle}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type PriceCollection = {
  id: string;
  label: string;
  href: string;
  hint: string;
};

export function PriceLedCollections({
  collections,
}: {
  collections: PriceCollection[];
}) {
  return (
    <section className="container-shell py-8 md:py-12">
      <div className="mb-5 md:mb-6">
        <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
          Shop by budget
        </h2>
        <p className="mt-1 text-sm text-muted">
          Price-led collections from published products
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={collection.href}
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5 transition hover:border-accent hover:shadow-[var(--shadow-card)]"
            >
              <span className="text-[20px] font-bold text-accent">
                {collection.label}
              </span>
              <span className="text-sm text-muted">{collection.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type SellerCardData = {
  id: string;
  name: string;
  href: string;
  productCount: number;
  categoryLabel?: string;
  statusLabel?: string;
  imageUrl?: string | null;
};

export function FeaturedSellers({ sellers }: { sellers: SellerCardData[] }) {
  if (sellers.length === 0) return null;

  return (
    <section className="container-shell flex flex-col gap-4 py-8 md:py-12">
      <div>
        <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
          Featured sellers
        </h2>
        <p className="mt-1 text-sm text-muted">
          Independent shops with approved catalogues
        </p>
      </div>

      <ProductLoopRail
        items={sellers}
        label="Featured sellers"
        renderItem={(seller) => {
          const style = brandLogoStyle();
          return (
            <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
              <div className="relative flex h-40 items-center justify-center bg-accent-soft sm:h-44">
                {seller.imageUrl ? (
                  <Image
                    src={seller.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 72vw, 304px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    className={`line-clamp-2 px-3 text-center ${style.className}`}
                    style={style.style}
                  >
                    {seller.name}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3 className="line-clamp-1 text-[16px] font-semibold">
                  {seller.name}
                </h3>
                {seller.categoryLabel ? (
                  <p className="text-sm text-muted">{seller.categoryLabel}</p>
                ) : null}
                <p className="text-xs text-muted">
                  {seller.productCount} products
                  {seller.statusLabel ? ` · ${seller.statusLabel}` : ""}
                </p>
                <Link
                  href={seller.href}
                  className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border text-[13px] font-semibold text-accent hover:border-accent"
                >
                  Visit store
                </Link>
              </div>
            </article>
          );
        }}
      />
    </section>
  );
}

/** @deprecated Prefer FeaturedSellers */
export const SellerLogoStrip = FeaturedSellers;

function brandLogoStyle(): {
  className: string;
  style?: CSSProperties;
} {
  return {
    className: "text-sm font-bold tracking-tight text-accent",
  };
}

export function SellerConversionSection() {
  return (
    <section className="container-shell py-8 md:py-12">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-accent-soft p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-[24px] leading-[32px] font-bold tracking-tight">
            Sell on Aspera
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            List products, manage orders, and reach shoppers across India with
            clear tools for catalogue, fulfilment, and payouts.
          </p>
        </div>
        <Link
          href="/seller/onboarding"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-[14px] font-semibold text-accent-foreground hover:bg-[var(--accent-hover)]"
        >
          Start selling
        </Link>
      </div>
    </section>
  );
}

/** Back-compat stubs — Meesho-era sections removed from homepage composition */
export function MeeshoAppHero() {
  return <AsperaHero />;
}

export function OriginalBrandsSection() {
  return null;
}

export function CampaignPromoBanner() {
  return null;
}

export type OriginalBrandCard = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
  overlay: string;
};

export type CampaignCollection = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};
