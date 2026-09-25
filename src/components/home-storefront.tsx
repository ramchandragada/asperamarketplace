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


function TrustReturnIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8H4a8 8 0 1 1-1.5 5"
        stroke="#9f2089"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7 4v4H3"
        stroke="#9f2089"
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
        stroke="#9f2089"
        strokeWidth="1.8"
      />
      <path
        d="M3 10h18M7 14h3"
        stroke="#9f2089"
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
        d="M7 8h10l-1 11H8L7 8z"
        stroke="#9f2089"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 8V7a2.5 2.5 0 0 1 5 0v1"
        stroke="#9f2089"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14" r="1.6" fill="#9f2089" />
    </svg>
  );
}

/** Meesho pink trust strip: return / COD / lowest prices */
export function TrustSignalBar() {
  const items = [
    { label: "7 Days Easy Return", Icon: TrustReturnIcon },
    { label: "Cash on Delivery", Icon: TrustCodIcon },
    { label: "Lowest Prices", Icon: TrustPriceIcon },
  ];
  return (
    <div className="bg-[#fce8f3]">
      <div className="container-shell py-2.5 md:py-3">
        <ul className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-y-2 rounded-lg bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-6">
          {items.map((item, index) => (
            <li
              key={item.label}
              className="flex items-center gap-2 px-3 text-[13px] text-[#333] sm:px-5"
            >
              {index > 0 ? (
                <span
                  className="mr-2 hidden h-5 w-px bg-[#e5e5e5] sm:block"
                  aria-hidden
                />
              ) : null}
              <item.Icon />
              <span className="font-medium">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
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

/** Meesho arched category row under the trust strip */
export function CategoryArches({
  categories,
}: {
  categories: Array<{
    id: string;
    label: string;
    href: string;
    imageUrl: string;
  }>;
}) {
  return (
    <section className="border-b border-[#eee] bg-white">
      <div className="container-shell py-5 md:py-7">
        <ul className="flex justify-between gap-2 overflow-x-auto pb-1 md:gap-3">
          {categories.map((category) => (
            <li key={category.id} className="min-w-[4.75rem] shrink-0 md:min-w-0 md:flex-1">
              <Link
                href={category.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span
                  className="relative flex h-[5.5rem] w-[5.5rem] items-end justify-center overflow-hidden bg-[#f3e8ff] transition group-hover:bg-[#ead9ff] sm:h-[6.5rem] sm:w-[6.5rem] md:h-[7.25rem] md:w-[7.25rem]"
                  style={{
                    borderRadius: "999px 999px 12px 12px",
                  }}
                >
                  <span className="relative h-[85%] w-[88%]">
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="116px"
                      className="object-cover object-top"
                    />
                  </span>
                </span>
                <span className="text-[12px] font-medium text-[#333] sm:text-[13px]">
                  {category.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
  if (key === "mi") {
    return {
      className:
        "inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#ff6700] text-sm font-bold text-white",
    };
  }
  if (key.includes("bata")) {
    return {
      className: "text-[18px] font-semibold italic text-[#e31c23]",
      style: { fontFamily: "var(--font-brand-script), Georgia, cursive" },
    };
  }
  if (key.includes("wow")) {
    return {
      className: "text-[11px] font-extrabold leading-tight tracking-wide text-[#111]",
    };
  }
  if (key.includes("mamaearth")) {
    return {
      className: "text-[13px] font-semibold lowercase text-[#0d9488]",
    };
  }
  if (key.includes("wild stone") || key.includes("wildstone")) {
    return {
      className: "text-[11px] font-black uppercase tracking-[0.08em] text-[#111]",
    };
  }
  if (key.includes("plum")) {
    return {
      className: "text-[16px] font-semibold lowercase text-[#6b21a8]",
    };
  }
  if (key.includes("nivea")) {
    return {
      className:
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0033a0] text-[9px] font-bold tracking-wide text-white",
    };
  }
  if (key.includes("himalaya")) {
    return {
      className: "text-[12px] font-bold leading-tight text-[#15803d]",
    };
  }
  if (key.includes("aspera")) {
    return {
      className: "text-[13px] font-semibold tracking-tight text-[#1a5c5c]",
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
    <div className="rounded-lg bg-[#f3e8ff]/70 px-3 py-4 md:px-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#666] uppercase">
          Featured brands
        </p>
        {logos.length > 4 ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Scroll brands left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg shadow-sm hover:border-[#9f2089] hover:text-[#9f2089]"
              onClick={() => scrollBy(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll brands right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white text-lg shadow-sm hover:border-[#9f2089] hover:text-[#9f2089]"
              onClick={() => scrollBy(1)}
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
      <div
        ref={scrollerRef}
        className="rail-scroll [grid-auto-columns:118px]"
      >
        {logos.map((logo) => {
          const style = brandLogoStyle(logo.name);
          return (
            <Link
              key={logo.id}
              href={logo.href}
              className="flex h-[58px] w-[118px] flex-col items-center justify-center rounded-md border border-white bg-white px-2 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:shadow-md"
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
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: -1 | 1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.min(320, node.clientWidth * 0.8),
      behavior: "smooth",
    });
  }

  return (
    <section className="border-b border-[#eee] bg-white py-6 md:py-8">
      <div className="container-shell flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[1.25rem] font-bold tracking-tight text-[#333] md:text-[1.5rem]">
            Original Brands
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#9f2089] text-[11px] font-bold text-white"
              aria-label="Verified"
              title="Verified brands"
            >
              ✓
            </span>
          </h2>
          <Link
            href="/shop"
            className="text-xs font-bold tracking-wide text-[#9f2089] uppercase hover:underline md:text-sm"
          >
            VIEW ALL &gt;
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollerRef}
            className="rail-scroll [grid-auto-columns:minmax(8.5rem,9.75rem)] md:[grid-auto-columns:minmax(9.5rem,10.5rem)]"
          >
            {cards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group relative flex h-[11.5rem] flex-col overflow-hidden rounded-xl border border-[#e8dff5] bg-[#ebe4f5] shadow-sm md:h-[13rem]"
              >
                <span className="relative flex-1">
                  <Image
                    src={card.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 156px, 168px"
                    className="object-contain object-center p-3 transition duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="bg-[#9f2089] px-2 py-2.5 text-center text-[13px] font-bold text-white">
                  {card.label}
                </span>
              </Link>
            ))}
          </div>
          {cards.length > 4 ? (
            <button
              type="button"
              aria-label="Scroll original brands right"
              className="absolute top-1/2 right-0 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-lg text-[#333] shadow-md hover:text-[#9f2089]"
              onClick={() => scrollBy(1)}
            >
              ›
            </button>
          ) : null}
        </div>

        {logos.length > 0 ? <BrandPartnersRail logos={logos} /> : null}
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

/** Meesho orange/purple first-order app promo */
export function CampaignPromoBanner({
  collections,
}: {
  collections: CampaignCollection[];
}) {
  return (
    <section className="container-shell py-5 md:py-7">
      <div className="grid overflow-hidden rounded-xl shadow-md md:grid-cols-[0.95fr_1.55fr]">
        <div className="relative flex min-h-[220px] flex-col justify-center gap-1 overflow-hidden bg-[#ff8a1f] px-6 py-8 md:min-h-[280px] md:px-8">
          <p className="text-sm font-semibold text-white">Up to</p>
          <p
            className="text-[2.75rem] leading-none font-black tracking-tight text-[#5b0a6e] md:text-[3.25rem]"
            style={{
              textShadow:
                "2px 2px 0 #ffe566, -1px -1px 0 #ffe566, 1px -1px 0 #ffe566, -1px 1px 0 #ffe566",
            }}
          >
            35% OFF
          </p>
          <p className="mt-1 text-lg font-bold text-[#5b0a6e]">on first order</p>
          <p className="mt-3 text-sm font-semibold text-[#5b0a6e]">
            *Only on App
          </p>
          <Link
            href="/download-app"
            className="mt-4 inline-flex w-fit rounded-md bg-[#5b0a6e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#4a0859]"
          >
            Download App
          </Link>
        </div>

        <div className="bg-[#9f2089] px-4 py-5 md:px-6 md:py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="group relative block aspect-[3/4] overflow-hidden rounded-xl border-2 border-[#ffe566] bg-[#fff8dc] shadow-sm"
              >
                <Image
                  src={collection.imageUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/45 px-1.5 py-1.5 text-center text-[10px] font-bold text-white sm:text-[11px]">
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
