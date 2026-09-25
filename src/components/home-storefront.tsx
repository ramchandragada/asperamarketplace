"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

export type HeroBubble = {
  label: string;
  href: string;
  imageUrl: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
  /** Left panel wash — teal / gold / magenta campaign tones */
  tone?: "teal" | "gold" | "magenta" | "orange";
  bubbles?: HeroBubble[];
};

const TONE_WASH: Record<NonNullable<HeroSlide["tone"]>, string> = {
  teal: "from-[#0f3d3d]/95 via-[#1a5c5c]/75 to-transparent",
  gold: "from-[#5c3d0f]/95 via-[#b8860b]/70 to-transparent",
  magenta: "from-[#4a1040]/95 via-[#9b1b6f]/70 to-transparent",
  orange: "from-[#5c2a0f]/95 via-[#e8833a]/65 to-transparent",
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0]!;

  function go(next: number) {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }

  return (
    <section
      className="relative overflow-hidden bg-accent text-accent-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null) return;
        const delta = end - start;
        if (Math.abs(delta) < 48) return;
        go(delta < 0 ? index + 1 : index - 1);
      }}
    >
      <div className="relative min-h-[280px] md:min-h-[380px] lg:min-h-[420px]">
        {slides.map((entry, i) => (
          <div
            key={entry.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            <Image
              src={entry.imageUrl}
              alt={entry.imageAlt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r ${
                TONE_WASH[entry.tone ?? "teal"]
              }`}
            />
            <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-gradient-to-l from-black/25 to-transparent md:block" />
          </div>
        ))}

        <div className="relative container-shell grid min-h-[280px] items-center gap-6 py-10 md:min-h-[380px] md:grid-cols-[1.15fr_0.85fr] md:py-12 lg:min-h-[420px]">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase backdrop-blur-sm">
              <span aria-hidden>✦</span>
              {slide.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {slide.title}
            </h1>
            {slide.subtitle ? (
              <p className="mt-3 max-w-md text-sm text-white/85 md:text-base">
                {slide.subtitle}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={slide.href}
                className="inline-flex rounded-[var(--radius-sm)] bg-brand-accent px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(232,131,58,0.35)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                {slide.ctaLabel || "Shop Now"}
              </Link>
              <Link
                href="/shop"
                className="inline-flex rounded-[var(--radius-sm)] border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                Browse all
              </Link>
            </div>
          </div>

          {(slide.bubbles?.length ?? 0) > 0 ? (
            <div className="hidden justify-self-end md:block">
              <div className="grid grid-cols-2 gap-4 lg:gap-5">
                {slide.bubbles!.slice(0, 4).map((bubble) => (
                  <Link
                    key={bubble.label}
                    href={bubble.href}
                    className="group flex w-[7.5rem] flex-col items-center gap-2 text-center lg:w-[8.5rem]"
                  >
                    <span className="relative h-[7.5rem] w-[7.5rem] overflow-hidden rounded-full border-[3px] border-white/80 bg-white/20 shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition group-hover:-translate-y-1 group-hover:border-brand-accent lg:h-[8.5rem] lg:w-[8.5rem]">
                      <Image
                        src={bubble.imageUrl}
                        alt=""
                        fill
                        sizes="136px"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </span>
                    <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                      {bubble.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Mobile bubbles strip */}
        {(slide.bubbles?.length ?? 0) > 0 ? (
          <div className="relative border-t border-white/15 bg-black/20 px-3 py-3 backdrop-blur-sm md:hidden">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {slide.bubbles!.map((bubble) => (
                <Link
                  key={bubble.label}
                  href={bubble.href}
                  className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5 text-center"
                >
                  <span className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white/70">
                    <Image
                      src={bubble.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <span className="text-[10px] font-semibold text-white">
                    {bubble.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white backdrop-blur-sm hover:bg-black/50 md:left-5"
        onClick={() => go(index - 1)}
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-xl text-white backdrop-blur-sm hover:bg-black/50 md:right-5"
        onClick={() => go(index + 1)}
      >
        ›
      </button>
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 md:bottom-5">
        {slides.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? "w-7 bg-white" : "w-2.5 bg-white/45 hover:bg-white/70"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}


export function TrustSignalBar() {
  const items = [
    { label: "7 Days Easy Return", icon: "✓" },
    { label: "Cash on Delivery", icon: "₹" },
    { label: "Lowest Prices", icon: "↓" },
  ];
  return (
    <div className="border-b border-border bg-white">
      <ul className="container-shell flex flex-wrap items-center justify-center gap-x-1 gap-y-1 py-2.5 text-xs text-muted sm:text-sm">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2 px-2 sm:px-3">
            {index > 0 ? (
              <span className="mr-1 text-border" aria-hidden>
                |
              </span>
            ) : null}
            <span className="font-semibold text-success" aria-hidden>
              {item.icon}
            </span>
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
    <section className="container-shell flex flex-col gap-4 py-8">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Shop by category
        </h2>
        <Link href="/browse" className="text-sm font-medium text-accent hover:underline">
          View all
        </Link>
      </div>
      <div className="category-scroll">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/browse?categorySlug=${encodeURIComponent(category.slug)}`}
            className="flex w-[6.25rem] flex-col items-center gap-2 text-center"
          >
            <span className="relative h-[7.5rem] w-[7.5rem] overflow-hidden rounded-full border-2 border-accent/25 bg-accent-soft shadow-sm transition group-hover:border-accent">
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
            <span className="line-clamp-2 text-xs font-medium leading-4">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PromoBanner({
  imageUrl,
  categories,
}: {
  imageUrl: string;
  categories: Array<{ slug: string; name: string; imageUrl?: string | null }>;
}) {
  return (
    <section className="container-shell py-2">
      <div className="grid overflow-hidden rounded-[var(--radius)] border border-border bg-accent-soft md:grid-cols-2">
        <div className="relative min-h-[220px]">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Quality products, trusted sellers
          </h2>
          <p className="text-sm text-muted">
            Discover value across fashion, home, beauty, and everyday essentials.
          </p>
          <div className="flex flex-wrap gap-3">
            {categories.slice(0, 4).map((category) => (
              <Link
                key={category.slug}
                href={`/browse?categorySlug=${encodeURIComponent(category.slug)}`}
                className="flex w-16 flex-col items-center gap-1"
              >
                <span className="relative h-14 w-14 overflow-hidden rounded-full border border-accent/30 bg-surface">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="line-clamp-2 text-center text-[10px] font-medium">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/browse"
            className="inline-flex w-fit rounded-[var(--radius-sm)] bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  );
}

export type SellerCardData = {
  id: string;
  name: string;
  href: string;
  productCount: number;
  ratingAverage: number;
};

export function SellerLogoStrip({ sellers }: { sellers: SellerCardData[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (sellers.length === 0) return null;

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8);
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section className="container-shell flex flex-col gap-4 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Shop by seller
          </h2>
          <p className="mt-1 text-sm text-muted">
            Verified shops with curated catalogues
          </p>
        </div>
        {sellers.length > 3 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll sellers left"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-lg text-foreground shadow-sm hover:border-accent hover:text-accent"
              onClick={() => scrollBy(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll sellers right"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-lg text-foreground shadow-sm hover:border-accent hover:text-accent"
              onClick={() => scrollBy(1)}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="rail-scroll [grid-auto-columns:minmax(9rem,10.5rem)]"
      >
        {sellers.map((seller) => {
          const style = brandLogoStyle(seller.name);
          return (
            <Link
              key={seller.id}
              href={seller.href}
              className="flex h-28 flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-white px-3 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-accent/40 hover:shadow-sm"
            >
              <span
                className={`line-clamp-2 ${style.className}`}
                style={style.style}
              >
                {seller.name}
              </span>
              <span className="text-[10px] font-medium text-muted">
                ★ {seller.ratingAverage.toFixed(1)} · {seller.productCount}{" "}
                products
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export type OriginalBrandCard = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
  overlay: string;
};

function brandLogoStyle(name: string): {
  className: string;
  style?: CSSProperties;
} {
  const key = name.toLowerCase();
  if (key.includes("aspera")) {
    return {
      className:
        "text-[13px] font-semibold tracking-tight text-[#1a5c5c]",
      style: { fontFamily: "var(--font-geist-sans), DM Sans, sans-serif" },
    };
  }
  if (key.includes("coastal") || key.includes("bloom")) {
    return {
      className: "text-[15px] italic font-medium text-[#0e7490]",
      style: { fontFamily: "var(--font-brand-script), Georgia, cursive" },
    };
  }
  if (key.includes("silicon") || key.includes("bay")) {
    return {
      className:
        "text-xs font-black uppercase tracking-[0.14em] text-[#334155]",
      style: { fontFamily: "var(--font-brand-tech), ui-sans-serif, sans-serif" },
    };
  }
  if (key.includes("narmada") || key.includes("weave")) {
    return {
      className: "text-[14px] font-semibold text-[#14532d]",
      style: { fontFamily: "var(--font-display), Georgia, serif" },
    };
  }
  if (key.includes("pulse") || key.includes("fit")) {
    return {
      className: "text-sm font-extrabold italic tracking-wide text-[#ea580c]",
      style: { fontFamily: "var(--font-brand-sport), Impact, sans-serif" },
    };
  }
  if (key.includes("lotus")) {
    return {
      className: "text-[14px] font-semibold text-[#db2777]",
      style: { fontFamily: "var(--font-brand-soft), Georgia, serif" },
    };
  }
  if (key.includes("quill") || key.includes("ink")) {
    return {
      className: "text-sm font-bold text-[#1e293b]",
      style: { fontFamily: "var(--font-display), 'Times New Roman', serif" },
    };
  }
  if (key.includes("trail")) {
    return {
      className:
        "text-[13px] font-bold uppercase tracking-wider text-[#78350f]",
      style: { fontFamily: "var(--font-brand-tech), Arial Narrow, sans-serif" },
    };
  }
  return {
    className: "text-sm font-bold tracking-tight text-foreground",
  };
}

function BrandPartnersRail({
  logos,
}: {
  logos: Array<{ id: string; name: string; href: string; mark?: string }>;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.min(280, node.clientWidth * 0.75),
      behavior: "smooth",
    });
  }

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-end justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
          Featured brand partners
        </p>
        {logos.length > 4 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll brands left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg shadow-sm hover:border-accent hover:text-accent"
              onClick={() => scrollBy(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll brands right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg shadow-sm hover:border-accent hover:text-accent"
              onClick={() => scrollBy(1)}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={scrollerRef}
        className="rail-scroll [grid-auto-columns:120px]"
      >
        {logos.map((logo) => {
          const style = brandLogoStyle(logo.name);
          return (
            <Link
              key={logo.id}
              href={logo.href}
              className="flex h-[60px] w-[120px] flex-col items-center justify-center rounded-xl border border-border bg-white px-2 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-accent/40 hover:shadow-sm"
            >
              <span
                className={`line-clamp-2 ${style.className}`}
                style={style.style}
              >
                {logo.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function OriginalBrandsSection({
  cards,
  logos,
}: {
  cards: OriginalBrandCard[];
  logos: Array<{ id: string; name: string; href: string; mark?: string }>;
}) {
  return (
    <section className="border-b border-border/70 bg-[#fbf8f3] py-8 md:py-10">
      <div className="container-shell flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight md:text-[1.75rem]">
            Original Brands
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground"
              aria-label="Verified"
              title="Verified brands"
            >
              ✓
            </span>
          </h2>
          <Link
            href="/shop"
            className="text-xs font-bold tracking-wide text-accent uppercase hover:underline md:text-sm"
          >
            View all &gt;
          </Link>
        </div>

        <div className="rail-scroll [grid-auto-columns:minmax(9.5rem,11rem)] md:[grid-auto-columns:minmax(11rem,13rem)]">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className="group relative block h-44 overflow-hidden rounded-[var(--radius)] border border-border/60 shadow-sm md:h-52"
            >
              <Image
                src={card.imageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 160px, 208px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span
                className="absolute inset-x-0 bottom-0 px-3 py-2.5 text-center text-sm font-bold text-white"
                style={{ backgroundColor: card.overlay }}
              >
                {card.label}
              </span>
            </Link>
          ))}
        </div>

        {logos.length > 0 ? (
          <BrandPartnersRail logos={logos} />
        ) : null}
      </div>
    </section>
  );
}

export type CampaignCollection = {
  id: string;
  label: string;
  href: string;
  imageUrl: string;
};

export function CampaignPromoBanner({
  collections,
}: {
  collections: CampaignCollection[];
}) {
  return (
    <section className="container-shell py-6 md:py-8">
      <div className="grid overflow-hidden rounded-[var(--radius)] border border-border shadow-sm md:grid-cols-2">
        {/* App offer — left */}
        <div className="relative flex min-h-[240px] flex-col justify-center gap-4 overflow-hidden bg-gradient-to-br from-[#ffb347] via-[#e8833a] to-[#d97706] px-6 py-8 text-[#1a2e2e] md:min-h-[280px] md:px-10">
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[#fef08a]/40 blur-xl"
            aria-hidden
          />
          <p className="relative text-xs font-bold tracking-[0.16em] uppercase">
            App exclusive
          </p>
          <h2 className="relative font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Up to 35% OFF on first order
          </h2>
          <p className="relative text-sm font-medium text-[#3f2a14]/90">
            *Only on App — download Aspera for launch deals and faster checkout.
          </p>
          <div className="relative mt-1">
            <Link
              href="/download-app"
              className="inline-flex rounded-[var(--radius-sm)] bg-[#1a5c5c] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#164c4c]"
            >
              Download Now
            </Link>
          </div>
        </div>

        {/* Curated collections — right */}
        <div className="bg-gradient-to-br from-[#7c1d6f] via-[#9b1b6f] to-[#4c1d95] px-5 py-7 md:px-8 md:py-8">
          <p className="mb-4 text-xs font-bold tracking-[0.14em] text-white/80 uppercase">
            Curated for you
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white/70 bg-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition group-hover:-translate-y-1 group-hover:border-white sm:h-28 sm:w-28 md:rounded-[1.25rem]">
                  <Image
                    src={collection.imageUrl}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#4a1040] shadow-sm sm:text-xs">
                  {collection.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
