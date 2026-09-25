"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
    { label: "Easy Returns", icon: "↩" },
    { label: "Cash on Delivery", icon: "₹" },
    { label: "Verified Sellers", icon: "✓" },
    { label: "Secure Payments", icon: "🔒" },
  ];
  return (
    <div className="border-y border-border bg-[#f8f5f0]">
      <ul className="container-shell flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 text-sm text-foreground">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="mr-2 hidden text-border sm:inline" aria-hidden>
                ·
              </span>
            ) : null}
            <span aria-hidden>{item.icon}</span>
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

export function SellerLogoStrip({
  sellers,
}: {
  sellers: Array<{ id: string; name: string; href: string }>;
}) {
  if (sellers.length === 0) return null;
  return (
    <section className="container-shell flex flex-col gap-4 py-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Shop by seller
      </h2>
      <div className="rail-scroll [grid-auto-columns:minmax(8rem,10rem)]">
        {sellers.map((seller) => (
          <Link
            key={seller.id}
            href={seller.href}
            className="flex h-20 items-center justify-center rounded-[var(--radius)] border border-border bg-surface px-3 text-center text-sm font-semibold text-muted grayscale transition hover:border-accent hover:text-accent hover:grayscale-0"
          >
            {seller.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
