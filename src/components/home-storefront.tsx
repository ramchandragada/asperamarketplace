"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ProductLoopRail } from "@/components/product-loop-rail";

/** Honest announcement strip for marketplace chrome */
export function AnnouncementStrip() {
  return (
    <div className="bg-accent text-accent-foreground">
      <p className="container-shell flex h-8 items-center justify-center text-center text-[12px] font-medium tracking-wide md:h-9 md:text-[13px]">
        Express 10–90 mins* · Authorised dealers · Genuine PC parts
      </p>
    </div>
  );
}

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** Full-bleed lifestyle photo in /public/hero */
  image: string;
};

/**
 * Full-bleed hero carousel. Self-hosted PC hardware plates under public/hero.
 */
/**
 * USP-led hero carousel — one promise per slide.
 * No chips/overlays on the photo; brand + one headline + one line + CTAs only.
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "express",
    eyebrow: "Aspera Express",
    title: "PC parts in minutes — not days",
    subtitle:
      "Hub stock at your door in 10–90 mins* by pin. The end of waiting on courier for a GPU.",
    ctaLabel: "Shop Express now",
    ctaHref: "/browse",
    image: "/hero/usp-express-minutes.jpg",
  },
  {
    id: "genuine",
    eyebrow: "Authorised brand dealers",
    title: "100% genuine. No grey-market lottery.",
    subtitle:
      "Every listing from authorised dealers — warranty-valid stock, not mystery marketplace sellers.",
    ctaLabel: "Browse genuine parts",
    ctaHref: "/browse",
    image: "/hero/usp-authorised-genuine.jpg",
  },
  {
    id: "warranty",
    eyebrow: "Warranty support",
    title: "Free pickup to the service centre — and back",
    subtitle:
      "If it’s under warranty, we collect from your door, take it to service, and return it. You don’t ship RMA yourself.",
    ctaLabel: "See warranty promise",
    ctaHref: "/why-aspera#warranty",
    image: "/hero/usp-warranty-pickup.jpg",
  },
  {
    id: "tech",
    eyebrow: "Free technical support",
    title: "Build help included — not a chatbot dead-end",
    subtitle:
      "Compatibility, install, and setup support from people who know PC parts. Free with every order.",
    ctaLabel: "Open PC Builder",
    ctaHref: "/pc-builder",
    image: "/hero/usp-tech-support.jpg",
  },
  {
    id: "gst",
    eyebrow: "Business buyers",
    title: "GST invoice with input credit",
    subtitle:
      "Proper tax invoices for registered businesses — built for SMEs who buy CPUs and GPUs on GSTIN.",
    ctaLabel: "Add business GSTIN",
    ctaHref: "/account/business",
    image: "/hero/usp-gst-business.jpg",
  },
  {
    id: "price",
    eyebrow: "Hub dealer pricing",
    title: "Local dealer rates. Online. Express.",
    subtitle:
      "Competitive hub pricing on authorised stock — without the days-long wait of big marketplaces.",
    ctaLabel: "Compare live prices",
    ctaHref: "/browse?sort=price_asc",
    image: "/hero/usp-hub-pricing.jpg",
  },
];

const HERO_AUTO_MS = 4800;

/** Aspera Forge hero — brand-first PC components carousel */
export function AsperaHero() {
  const labelId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [announce, setAnnounce] = useState("");
  const count = HERO_SLIDES.length;
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  // Hover and focus used to pause the timer. A phone tap fires mouseenter
  // and often never mouseleave, so autoplay stopped and stayed stopped.
  const paused = held;

  const clearHiddenFocus = useCallback(() => {
    const root = rootRef.current;
    const active = document.activeElement;
    if (!root || !(active instanceof HTMLElement)) return;
    if (!root.contains(active)) return;
    const slide = active.closest("[data-hero-slide]");
    if (slide?.getAttribute("aria-hidden") === "true") {
      active.blur();
    }
  }, []);

  const go = useCallback(
    (next: number) => {
      const resolved = ((next % count) + count) % count;
      setIndex(resolved);
      const entry = HERO_SLIDES[resolved]!;
      setAnnounce(`${entry.eyebrow}: ${entry.title}`);
      setHeld(true);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => setHeld(false), 8000);
    },
    [count],
  );

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  useEffect(() => {
    clearHiddenFocus();
  }, [index, clearHiddenFocus]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, HERO_AUTO_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden border-b border-border"
      aria-roledescription="carousel"
      aria-labelledby={labelId}
      onTouchStart={(event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        const touch = event.changedTouches[0];
        if (!start || !touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        go(dx < 0 ? index + 1 : index - 1);
      }}
    >
      <h2 id={labelId} className="sr-only">
        Aspera promises — Express PC parts
      </h2>

      <div className="relative grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] md:grid-cols-[4.25rem_minmax(0,1fr)_4.25rem]">
        <div className="relative col-start-2 row-start-1 min-h-[32rem] md:min-h-[36rem] lg:min-h-[40rem] xl:min-h-[44rem]">
        {HERO_SLIDES.map((entry, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={entry.id}
              data-hero-slide={entry.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count}: ${entry.eyebrow}`}
              aria-hidden={!active}
              className={`absolute inset-0 bg-[#0B1220] transition-opacity duration-700 ease-out ${
                active
                  ? "z-[1] opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              {/* Photo fills the banner, including the arrow gutters.
                  Copy stays in the center column so the arrows cannot cover it. */}
              <div
                className="absolute inset-y-0 -left-[3.25rem] -right-[3.25rem] md:-left-[4.25rem] md:-right-[4.25rem]"
                aria-hidden
              >
                <Image
                  src={entry.image}
                  alt=""
                  fill
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover object-[68%_center] md:object-[72%_center]"
                />
              </div>
              <div
                className="absolute inset-y-0 -left-[3.25rem] -right-[3.25rem] bg-[linear-gradient(90deg,rgba(11,18,32,0.92)_0%,rgba(11,18,32,0.72)_48%,rgba(11,18,32,0.28)_100%)] md:-left-[4.25rem] md:-right-[4.25rem] md:bg-[linear-gradient(90deg,rgba(11,18,32,0.9)_0%,rgba(11,18,32,0.58)_34%,rgba(11,18,32,0.18)_66%,rgba(11,18,32,0.06)_100%)]"
                aria-hidden
              />

              <div className="relative z-[2] container-shell flex h-full min-h-[32rem] flex-col justify-center pt-6 pb-[5.25rem] md:min-h-[36rem] md:py-16 lg:min-h-[40rem] xl:min-h-[44rem]">
                <div className="max-w-[21rem] text-white md:max-w-[30rem]">
                  <p className="font-display text-[32px] font-bold tracking-[-0.04em] text-white drop-shadow-sm md:text-[48px]">
                    ASPERA
                  </p>
                  <p className="mt-2 text-[12px] font-semibold tracking-[0.14em] text-[color:var(--brand-accent)] uppercase md:text-[13px]">
                    {entry.eyebrow}
                  </p>
                  <p className="font-display mt-2 text-[26px] leading-[32px] font-bold tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] md:text-[40px] md:leading-[46px]">
                    {entry.title}
                  </p>
                  <p className="mt-3 max-w-md text-[15px] leading-[23px] text-white/90 md:text-[16px] md:leading-[25px]">
                    {entry.subtitle}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={entry.ctaHref}
                      className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[color:var(--brand-accent)] px-6 text-[14px] font-semibold text-[#0B1220] shadow-sm transition hover:brightness-105"
                      tabIndex={active ? 0 : -1}
                    >
                      {entry.ctaLabel}
                    </Link>
                    <Link
                      href="/why-aspera"
                      className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-white/55 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                      tabIndex={active ? 0 : -1}
                    >
                      Why Aspera wins
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dots sit in the center column's bottom band so they stay off the
            headline and the call-to-action buttons. */}
        <div className="absolute inset-x-0 bottom-3 z-[3] flex items-center justify-center md:bottom-4">
          <div className="flex gap-2">
            {HERO_SLIDES.map((entry, slideIndex) => {
              const active = slideIndex === index;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`Show ${entry.eyebrow}`}
                  aria-current={active ? "true" : undefined}
                  className="inline-flex h-11 w-8 items-center justify-center md:h-auto md:w-auto"
                  onClick={() => go(slideIndex)}
                >
                  <span
                    className={`h-2 rounded-full transition-all ${
                      active
                        ? "w-6 bg-white shadow-sm"
                        : "w-2 bg-white/55 hover:bg-white/80"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
        </div>

        {/* Side columns keep the arrows off the headline */}
        <div className="z-[4] col-start-1 row-start-1 flex items-center justify-center">
          <button
            type="button"
            aria-label="Previous banner"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.85))] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => go(index - 1)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              <path
                d="M14.5 6.5 9 12l5.5 5.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="z-[4] col-start-3 row-start-1 flex items-center justify-center">
          <button
            type="button"
            aria-label="Next banner"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.85))] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={() => go(index + 1)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
              <path
                d="M9.5 6.5 15 12l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}

export type PromoLane = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};

/**
 * Compact discovery strip — sharp tech lanes (no Meesho terracotta panel).
 */
export function DiscoveryPromoBanner({ lanes }: { lanes: PromoLane[] }) {
  if (lanes.length === 0) return null;
  const cards = lanes.slice(0, 4);

  return (
    <section className="container-shell py-4 md:py-5">
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {cards.map((lane) => (
          <li key={lane.id}>
            <Link
              href={lane.href}
              className="group relative flex aspect-[4/3] overflow-hidden rounded-[10px] bg-[#121A2B] shadow-[var(--shadow-card)]"
            >
              <Image
                src={lane.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, 22vw"
                className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(11,18,32,0.78)_100%)]" />
              <span className="absolute inset-x-3 bottom-3">
                <span className="font-display text-[14px] font-semibold text-white md:text-[15px]">
                  {lane.label}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export type SelectTile = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};

export type BuildLane = {
  id: string;
  label: string;
  description: string;
  href: string;
  imageUrl: string;
};

/** Build lanes — Gaming / Creator / Office (replaces Meesho Selects arches). */
export function BuildLanes({ lanes }: { lanes: BuildLane[] }) {
  const cards = lanes.slice(0, 3);
  if (cards.length === 0) return null;

  return (
    <section className="container-shell py-4 md:py-6">
      <div className="mb-3 flex items-end justify-between gap-3 md:mb-4">
        <div>
          <h2 className="font-display text-[22px] leading-[28px] font-bold tracking-tight md:text-[26px] md:leading-[32px]">
            Start a build
          </h2>
          <p className="mt-1 text-sm text-muted">
            Pick a lane — we surface the right components
          </p>
        </div>
        <Link
          href="/pc-builder"
          className="text-sm font-medium text-accent hover:underline"
        >
          Open PC Builder
        </Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((lane) => (
          <li key={lane.id}>
            <Link
              href={`/pc-builder?preset=${lane.id}`}
              className="group relative flex h-[200px] overflow-hidden rounded-[12px] md:h-[240px]"
            >
              <Image
                src={lane.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,0.08)_0%,rgba(11,18,32,0.55)_55%,rgba(11,18,32,0.88)_100%)]" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                <span className="font-display block text-[18px] font-bold tracking-tight md:text-[22px]">
                  {lane.label}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-white/88 md:text-[14px]">
                  {lane.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * @deprecated Prefer BuildLanes — kept so older imports compile.
 */
export function AsperaSelectsBanner({ tiles }: { tiles: SelectTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <BuildLanes
      lanes={tiles.slice(0, 3).map((tile) => ({
        id: tile.id,
        label: tile.label,
        description: "Shop components",
        href: tile.href,
        imageUrl: tile.imageUrl,
      }))}
    />
  );
}

/**
 * @deprecated Prefer AsperaPromiseStrip from `@/components/aspera-promises`.
 * Kept so older imports compile.
 */
export function TrustSignalBar() {
  return null;
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
            <span className="photo-well relative h-[7.5rem] w-[7.5rem] overflow-hidden rounded-[10px] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(11,18,32,0.1)]">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-contain object-center p-2"
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

/**
 * Square category tiles — mobile only for now.
 * Desktop already exposes every category in the top nav; revisit mobile IA later.
 */
export function ShopByCategory({
  categories,
}: {
  categories: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
    bgTint?: string;
  }>;
}) {
  // Show every PC category — truncating hid UPS and forced wrong tile reuse earlier.
  const tiles = categories;

  return (
    <section className="bg-background md:hidden">
      <div className="container-shell pt-5 pb-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-[22px] leading-[28px] font-bold tracking-tight">
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
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-[10px] border border-border bg-white transition-[border-color] duration-200 group-hover:border-[#cfd6e0]">
                <Image
                  src={category.imageUrl}
                  alt={category.label}
                  fill
                  sizes="(max-width: 640px) 140px, 180px"
                  className="object-contain object-center p-2 transition duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="text-[14px] font-medium text-foreground">
                {category.label}
              </span>
            </Link>
          )}
        />
      </div>
    </section>
  );
}

/** Shop By Brands — logo-only cards (no category eyebrow, no brand name caption). */
export function ShopByBrands({
  brands,
}: {
  brands: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
  }>;
}) {
  const tiles = brands.slice(0, 8);
  if (tiles.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="container-shell pt-2 pb-5 md:pt-3 md:pb-6">
        <div className="px-0 py-1 md:py-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-[20px] leading-[26px] font-bold tracking-tight text-foreground md:text-[22px] md:leading-[28px]">
                Shop by brand
              </h2>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted"
                aria-label="Verified brands"
                title="Verified brands"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 12.5l3.5 3.5L18 8"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <Link
              href="/browse"
              className="text-[12px] font-semibold tracking-wide text-accent uppercase hover:underline"
            >
              View all →
            </Link>
          </div>
          <ProductLoopRail
            items={tiles}
            label="Shop by brand"
            variant="brands"
            renderItem={(brand) => (
              <Link
                href={brand.href}
                aria-label={`Shop ${brand.label}`}
                className="group flex overflow-hidden rounded-[10px] border border-border bg-white transition-[border-color] duration-200 hover:border-[#cfd6e0]"
              >
                <span className="relative aspect-[5/4] w-full bg-white">
                  {/* Local SVG brand marks — next/image does not optimize them well. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-center p-6 transition duration-300 group-hover:scale-[1.03] md:p-7"
                  />
                </span>
              </Link>
            )}
          />
        </div>
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
    <section className="container-shell py-4 md:py-5">
      <div className="mb-2.5 md:mb-3">
        <h2 className="text-[22px] leading-[28px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
          Featured collections
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Curated picks from live catalogue categories
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href}
              className="group relative flex h-[180px] overflow-hidden rounded-2xl md:h-[220px]"
            >
              <Image
                src={tile.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover object-center transition duration-500 group-hover:scale-[1.05]"
              />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(15,47,58,0.78)_100%)]" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white md:p-5">
                <span className="block text-[18px] font-bold leading-6 tracking-tight md:text-[20px]">
                  {tile.title}
                </span>
                <span className="mt-1 block text-[13px] text-white/90">
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

export type UpgradeIntent = {
  id: string;
  label: string;
  href: string;
  hint: string;
};

/** Drop-in upgrade intents — complements Start a build (new PCs). */
export function PopularUpgrades({
  upgrades,
}: {
  upgrades: UpgradeIntent[];
}) {
  if (upgrades.length === 0) return null;

  return (
    <section className="container-shell py-4 md:py-5">
      <div className="mb-2.5 md:mb-3">
        <h2 className="text-[22px] leading-[28px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
          Popular upgrades
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Drop-in parts for the PC you already have
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {upgrades.map((upgrade) => (
          <li key={upgrade.id}>
            <Link
              href={upgrade.href}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-white p-5 transition-[border-color] duration-200 hover:border-[#cfd6e0]"
            >
              <span className="font-display text-[22px] font-bold tracking-tight text-brand-accent">
                {upgrade.label}
              </span>
              <span className="text-sm text-muted">{upgrade.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** @deprecated Prefer PopularUpgrades — kept so older imports compile. */
export type PriceCollection = UpgradeIntent;

/** @deprecated Prefer PopularUpgrades */
export function PriceLedCollections({
  collections,
}: {
  collections: PriceCollection[];
}) {
  return <PopularUpgrades upgrades={collections} />;
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
    <section className="container-shell flex flex-col gap-3 py-4 md:gap-3.5 md:py-5">
      <div>
        <h2 className="text-[22px] leading-[28px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
          Featured sellers
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          Independent shops with approved catalogues
        </p>
      </div>

      <ProductLoopRail
        items={sellers}
        label="Featured sellers"
        renderItem={(seller) => {
          const style = brandLogoStyle();
          return (
            <article className="flex h-full flex-col overflow-hidden rounded-[10px] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,18,32,0.1)]">
              <div className="photo-well relative flex h-40 items-center justify-center sm:h-44">
                {seller.imageUrl ? (
                  <Image
                    src={seller.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 72vw, 304px"
                    className="object-contain object-center p-3"
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
    <section className="container-shell py-5 md:py-6">
      <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-[#0B1220] p-5 text-white md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <h2 className="font-display text-[24px] leading-[32px] font-bold tracking-tight">
            Sell PC parts on Aspera
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
            List components, manage orders, and reach Pune builders with clear
            tools for catalogue, fulfilment, and payouts.
          </p>
        </div>
        <Link
          href="/seller/onboarding"
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[color:var(--brand-accent)] px-5 text-[14px] font-semibold text-[#0B1220] hover:brightness-105"
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

export function OriginalBrandsSection({
  brands,
}: {
  brands?: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
    bgTint?: string;
    offer?: string;
  }>;
}) {
  if (!brands?.length) return null;
  return <ShopByBrands brands={brands} />;
}

export function CampaignPromoBanner() {
  return null;
}

export type OriginalBrandCard = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
  overlay?: string;
  bgTint?: string;
  offer?: string;
};

export type CampaignCollection = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};
