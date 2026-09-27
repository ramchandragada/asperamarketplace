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

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** Primary polished product cutout */
  productImage: string;
  /** Soft well tint behind the cutout */
  wellTint: string;
  /** Optional supporting cutouts for a merchandising cluster */
  supportImages?: string[];
  /** Bright left-panel gradient — Aspera palette */
  panelGradient: string;
  accentChip: string;
};

/**
 * Full-bleed hero carousel — polished product merchandising
 * (cutouts on soft wells, no candid lifestyle photos).
 * Copy still spans every life stage from baby to seniors.
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "newborn",
    eyebrow: "Newborn & baby",
    title: "Soft starts for tiny travellers",
    subtitle:
      "Care essentials, softwear, and nursery picks for the first chapter.",
    ctaLabel: "Shop baby",
    ctaHref: "/browse?categorySlug=baby-kids&q=baby",
    productImage: "/category-tiles/kids.png",
    wellTint: "#FFF1EA",
    supportImages: ["/category-tiles/home.png", "/category-tiles/beauty.png"],
    panelGradient:
      "linear-gradient(145deg,#FF8A65 0%,#FF6B4A 42%,#E66A3D 100%)",
    accentChip: "From day one",
  },
  {
    id: "kids",
    eyebrow: "Kids & play",
    title: "Bright finds for growing explorers",
    subtitle:
      "Clothes, toys, and school staples that keep pace with every adventure.",
    ctaLabel: "Shop kids",
    ctaHref: "/browse?categorySlug=baby-kids&audience=kids",
    productImage: "/category-tiles/kids.png",
    wellTint: "#E8F7F4",
    supportImages: [
      "/category-tiles/footwear.png",
      "/category-tiles/bags.png",
    ],
    panelGradient:
      "linear-gradient(145deg,#2EC4B6 0%,#1FA8A0 48%,#148F8A 100%)",
    accentChip: "Ages 2–12",
  },
  {
    id: "youth",
    eyebrow: "Teens & young adults",
    title: "Style that keeps up with you",
    subtitle:
      "Fashion, beauty, and gadgets for every mood — clear prices, real sellers.",
    ctaLabel: "Shop fashion",
    ctaHref: "/browse?categorySlug=fashion",
    productImage: "/category-tiles/women.png",
    wellTint: "#FFF6E8",
    supportImages: [
      "/category-tiles/beauty.png",
      "/category-tiles/electronics.png",
    ],
    panelGradient:
      "linear-gradient(145deg,#F5B544 0%,#E89A2E 45%,#D4841A 100%)",
    accentChip: "Trending now",
  },
  {
    id: "family",
    eyebrow: "Home & family",
    title: "Everything for the whole household",
    subtitle:
      "Kitchen, living, and everyday essentials that make shared spaces work.",
    ctaLabel: "Shop home",
    ctaHref: "/browse?categorySlug=home-kitchen",
    productImage: "/category-tiles/home.png",
    wellTint: "#EAF3F8",
    supportImages: ["/category-tiles/men.png", "/category-tiles/women.png"],
    panelGradient:
      "linear-gradient(145deg,#3D9BCC 0%,#2A7FA8 48%,#1A668A 100%)",
    accentChip: "Family favourites",
  },
  {
    id: "elders",
    eyebrow: "Seniors & wellness",
    title: "Comfort and care, thoughtfully chosen",
    subtitle:
      "Wellness, easy living, and trusted everyday picks for later years.",
    ctaLabel: "Shop wellness",
    ctaHref: "/browse?categorySlug=health-wellness",
    productImage: "/category-tiles/beauty.png",
    wellTint: "#E8F0F0",
    supportImages: ["/category-tiles/home.png", "/category-tiles/footwear.png"],
    panelGradient:
      "linear-gradient(145deg,#4DB6A5 0%,#2F7F8A 48%,#123B4A 100%)",
    accentChip: "Graceful living",
  },
];

const HERO_AUTO_MS = 5200;

/** Aspera hero — polished product carousel (newborn → elderly copy) */
export function AsperaHero() {
  const labelId = useId();
  const rootRef = useRef<HTMLElement | null>(null);
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [announce, setAnnounce] = useState("");
  const count = HERO_SLIDES.length;
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = userPaused || hoverPaused;

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
      setUserPaused(true);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => setUserPaused(false), 8000);
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
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHoverPaused(false);
        }
      }}
    >
      <h2 id={labelId} className="sr-only">
        Aspera highlights — shopping for every age
      </h2>

      <div className="relative min-h-[min(78vw,24rem)] md:min-h-[22rem] lg:min-h-[24rem]">
        {HERO_SLIDES.map((entry, slideIndex) => {
          const active = slideIndex === index;
          const supports = entry.supportImages?.slice(0, 2) ?? [];
          return (
            <div
              key={entry.id}
              data-hero-slide={entry.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count}: ${entry.eyebrow}`}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                active
                  ? "z-[1] opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <div
                className="absolute inset-0"
                style={{ background: entry.panelGradient }}
                aria-hidden
              />
              <div
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 16% 20%, rgba(255,255,255,0.55) 0%, transparent 42%), radial-gradient(circle at 82% 72%, rgba(255,255,255,0.22) 0%, transparent 40%)",
                }}
                aria-hidden
              />

              {/* Polished merchandising panel — product cutouts on soft wells */}
              <div className="absolute inset-y-0 right-0 flex w-[min(62%,44rem)] items-center justify-center px-4 py-6 md:w-[56%] md:px-8 md:py-8">
                <div
                  className="relative flex h-full w-full max-w-[34rem] items-center justify-center gap-3 rounded-[1.75rem] px-4 py-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] md:gap-4 md:px-6 md:py-6"
                  style={{
                    background: `radial-gradient(120% 120% at 50% 30%, #ffffff 0%, ${entry.wellTint} 58%, ${entry.wellTint} 100%)`,
                  }}
                >
                  {supports[0] ? (
                    <div className="relative hidden aspect-[3/4] w-[22%] max-w-[7.5rem] overflow-hidden rounded-2xl bg-white/50 shadow-[0_10px_28px_rgba(18,59,74,0.1)] sm:block">
                      <Image
                        src={supports[0]}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-contain object-center p-2"
                      />
                    </div>
                  ) : null}
                  <div className="relative aspect-square w-[58%] max-w-[16rem] overflow-hidden rounded-[1.5rem] bg-white/60 shadow-[0_16px_40px_rgba(18,59,74,0.12)] md:w-[62%]">
                    <Image
                      src={entry.productImage}
                      alt=""
                      fill
                      priority={slideIndex === 0}
                      sizes="(max-width: 768px) 45vw, 280px"
                      className="object-contain object-center p-3 md:p-4"
                    />
                  </div>
                  {supports[1] ? (
                    <div className="relative hidden aspect-[3/4] w-[22%] max-w-[7.5rem] overflow-hidden rounded-2xl bg-white/50 shadow-[0_10px_28px_rgba(18,59,74,0.1)] sm:block">
                      <Image
                        src={supports[1]}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-contain object-center p-2"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="relative z-[2] container-shell flex h-full min-h-[min(78vw,24rem)] flex-col justify-center py-10 md:min-h-[22rem] md:py-12 lg:min-h-[24rem]">
                <div className="max-w-[20rem] text-white md:max-w-[26rem]">
                  <p className="font-display text-[26px] font-bold tracking-tight drop-shadow-sm md:text-[32px]">
                    Aspera
                  </p>
                  <span className="mt-3 inline-flex rounded-md bg-white/20 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm md:text-[12px]">
                    {entry.accentChip}
                  </span>
                  <p className="mt-3 text-[13px] font-semibold tracking-wide text-white/90 uppercase md:text-[14px]">
                    {entry.eyebrow}
                  </p>
                  <p className="mt-2 text-[26px] leading-[32px] font-bold tracking-tight md:text-[36px] md:leading-[42px]">
                    {entry.title}
                  </p>
                  <p className="mt-2 max-w-sm text-[14px] leading-[21px] text-white/92 md:text-[15px] md:leading-[23px]">
                    {entry.subtitle}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={entry.ctaHref}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 text-[14px] font-semibold text-accent shadow-sm transition hover:bg-accent-soft"
                      tabIndex={active ? 0 : -1}
                    >
                      {entry.ctaLabel}
                    </Link>
                    <Link
                      href="/browse"
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/55 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                      tabIndex={active ? 0 : -1}
                    >
                      Explore all
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Edge arrows */}
        <div className="pointer-events-none absolute inset-y-0 z-[3] flex w-full items-center justify-between px-2 md:px-3">
          <button
            type="button"
            aria-label="Previous banner"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/85 text-accent shadow-sm backdrop-blur-sm transition hover:bg-white md:h-10 md:w-10"
            onClick={() => go(index - 1)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M14.5 6.5 9 12l5.5 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next banner"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/85 text-accent shadow-sm backdrop-blur-sm transition hover:bg-white md:h-10 md:w-10"
            onClick={() => go(index + 1)}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path
                d="M9.5 6.5 15 12l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Dots + pause control */}
        <div className="absolute inset-x-0 bottom-3 z-[3] flex items-center justify-center gap-3 md:bottom-4">
          <div className="flex gap-2">
            {HERO_SLIDES.map((entry, slideIndex) => {
              const active = slideIndex === index;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`Show ${entry.eyebrow}`}
                  aria-current={active ? "true" : undefined}
                  className={`h-2 rounded-full transition-all ${
                    active
                      ? "w-6 bg-white shadow-sm"
                      : "w-2 bg-white/55 hover:bg-white/80"
                  }`}
                  onClick={() => go(slideIndex)}
                />
              );
            })}
          </div>
          <button
            type="button"
            aria-label={
              userPaused ? "Play banner rotation" : "Pause banner rotation"
            }
            aria-pressed={userPaused}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/85 text-accent shadow-sm backdrop-blur-sm transition hover:bg-white"
            onClick={() => {
              if (resumeTimer.current) clearTimeout(resumeTimer.current);
              setUserPaused((value) => !value);
            }}
          >
            {userPaused ? (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 5.5v13l11-6.5L8 5.5Z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M7 5h3.5v14H7V5Zm6.5 0H17v14h-3.5V5Z" />
              </svg>
            )}
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
 * Homepage discovery banner — sober Aspera take on Meesho’s split promo:
 * offer panel + four tall collection lanes.
 */
export function DiscoveryPromoBanner({ lanes }: { lanes: PromoLane[] }) {
  if (lanes.length === 0) return null;
  const cards = lanes.slice(0, 4);

  return (
    <section className="container-shell py-3 md:py-4">
      <div className="grid overflow-hidden rounded-2xl md:grid-cols-[minmax(15rem,0.85fr)_1.55fr]">
        <div className="flex flex-col justify-between bg-[linear-gradient(160deg,#E66A3D_0%,#D4572F_55%,#C24A28_100%)] px-6 py-8 text-white md:px-8 md:py-10">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-white/85 uppercase">
              Aspera picks
            </p>
            <h2 className="mt-3 max-w-[14rem] text-[28px] leading-[34px] font-bold tracking-tight md:text-[32px] md:leading-[38px]">
              Fresh finds for everyday India
            </h2>
            <p className="mt-3 max-w-[16rem] text-[14px] leading-5 text-white/90">
              Honest prices from independent sellers — shop trending, budget,
              and essentials in one place.
            </p>
          </div>
          <Link
            href="/browse"
            className="mt-8 inline-flex min-h-11 w-fit items-center justify-center rounded-lg bg-white px-6 text-[14px] font-semibold text-accent transition hover:bg-accent-soft"
          >
            Shop now
          </Link>
        </div>

        <div className="bg-accent px-3 py-4 md:px-5 md:py-5">
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {cards.map((lane) => (
              <li key={lane.id}>
                <Link
                  href={lane.href}
                  className="group relative flex aspect-[3/5] overflow-hidden rounded-xl bg-accent-soft shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                >
                  <Image
                    src={lane.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, 18vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(15,47,58,0.55)_100%)]" />
                  <span className="absolute inset-x-2 bottom-3 flex justify-center">
                    <span className="inline-flex min-h-8 items-center rounded-full bg-white px-3 text-center text-[12px] font-semibold text-foreground shadow-sm md:text-[13px]">
                      {lane.label}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export type SelectTile = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};

/**
 * Soft “selects” panel — lifestyle + 2×2 arched category tiles
 * (Aspera teal, not a gold Meesho clone).
 */
export function AsperaSelectsBanner({ tiles }: { tiles: SelectTile[] }) {
  const cards = tiles.slice(0, 4);
  if (cards.length === 0) return null;

  return (
    <section className="container-shell py-3 md:py-4">
      <div className="grid overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#123B4A_0%,#1A5566_45%,#0F2F3A_100%)] md:grid-cols-[1.05fr_1fr]">
        <div className="relative min-h-[220px] md:min-h-[280px]">
          <Image
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1400&q=85"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_30%,rgba(15,47,58,0.78)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            <p className="font-display text-[22px] font-bold tracking-tight md:text-[26px]">
              Aspera Selects
            </p>
            <p className="mt-1 text-[14px] text-white/85 md:text-[15px]">
              Products you love. Quality we stand behind.
            </p>
            <Link
              href="/browse"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-white/50 px-5 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              Shop now
            </Link>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 p-4 md:gap-4 md:p-6">
          {cards.map((tile) => (
            <li key={tile.id}>
              <Link
                href={tile.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="relative aspect-[4/5] w-full overflow-hidden rounded-[999px_999px_1.25rem_1.25rem] border border-white/35 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                  <Image
                    src={tile.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 40vw, 18vw"
                    className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
                  />
                </span>
                <span className="text-[13px] font-semibold tracking-wide text-[#D7E8EC] md:text-[14px]">
                  {tile.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Trust strip — full-bleed service bar under the hero */
export function TrustSignalBar() {
  const items = [
    { label: "Easy returns on eligible orders", Icon: TrustReturnIcon },
    { label: "Cash on delivery available", Icon: TrustCodIcon },
    { label: "Clear prices before you buy", Icon: TrustPriceIcon },
  ];
  return (
    <div className="w-full border-b border-border bg-accent-soft">
      <ul className="container-shell flex flex-wrap items-center justify-center gap-x-1 gap-y-2 py-3 text-[13px] text-foreground md:justify-between md:py-3.5 lg:max-w-none lg:px-10">
        {items.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center gap-2 px-3 text-accent sm:px-4 md:px-2"
          >
            {index > 0 ? (
              <span
                className="mr-2 hidden h-4 w-px bg-border sm:block md:hidden"
                aria-hidden
              />
            ) : null}
            <item.Icon />
            <span className="font-medium">{item.label}</span>
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

/** Square category tiles — cut-out products filling soft pastel wells */
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
  const tiles = categories.slice(0, 8);

  return (
    <section className="bg-surface">
      <div className="container-shell pt-4 pb-2 md:pt-5 md:pb-3">
        <div className="mb-2.5 flex items-end justify-between gap-3 md:mb-3">
          <h2 className="text-[22px] leading-[28px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
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
              <span
                className="relative aspect-square w-full overflow-hidden rounded-2xl transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_28px_rgba(18,59,74,0.12)]"
                style={{
                  background: `radial-gradient(120% 120% at 50% 35%, #ffffff 0%, ${category.bgTint ?? "#F3F5F6"} 62%, ${category.bgTint ?? "#F3F5F6"} 100%)`,
                }}
              >
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 140px, 180px"
                  className="object-contain object-center p-1.5 transition duration-300 group-hover:scale-[1.04] md:p-2"
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

/** Shop By Brands — Meesho Original Brands-style panel with teal footers */
export function ShopByBrands({
  brands,
}: {
  brands: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
    bgTint?: string;
    offer?: string;
  }>;
}) {
  const tiles = brands.slice(0, 8);
  if (tiles.length === 0) return null;

  return (
    <section className="bg-surface">
      <div className="container-shell pt-2 pb-4 md:pt-3 md:pb-5">
        <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#F8EDE4_0%,#F3E8EF_42%,#E6F0F2_100%)] px-3 py-4 shadow-[inset_0_0_0_1px_rgba(18,59,74,0.06)] md:px-5 md:py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] leading-[26px] font-bold tracking-tight text-foreground md:text-[22px] md:leading-[28px]">
                Shop By Brands
              </h2>
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
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
            label="Shop By Brands"
            variant="brands"
            renderItem={(brand) => (
              <Link
                href={brand.href}
                className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_0_rgba(18,59,74,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(18,59,74,0.12)]"
              >
                <span
                  className="relative aspect-[3/4] w-full"
                  style={{ backgroundColor: brand.bgTint ?? "#F3EEF8" }}
                >
                  {brand.offer ? (
                    <span className="absolute top-2 left-2 z-10 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase shadow-sm">
                      {brand.offer}
                    </span>
                  ) : null}
                  <Image
                    src={brand.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 150px, 190px"
                    className="object-contain object-center p-3 transition duration-300 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="flex min-h-10 items-center justify-center bg-accent px-2 py-2 text-center text-[12px] font-semibold tracking-wide text-accent-foreground md:min-h-11 md:text-[13px]">
                  {brand.label}
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
    <section className="container-shell py-4 md:py-5">
      <div className="mb-2.5 md:mb-3">
        <h2 className="text-[22px] leading-[28px] font-bold tracking-tight md:text-[24px] md:leading-[32px]">
          Shop by budget
        </h2>
        <p className="mt-0.5 text-sm text-muted">
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
    <section className="container-shell py-4 md:py-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-accent-soft p-5 md:flex-row md:items-center md:justify-between md:p-6">
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
