"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  ctaLabel: string;
  href: string;
  imageUrl: string;
  imageAlt: string;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index] ?? slides[0]!;

  return (
    <section className="relative overflow-hidden bg-accent text-accent-foreground">
      <div className="relative min-h-[220px] md:min-h-[320px]">
        {slides.map((entry, i) => (
          <div
            key={entry.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
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
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
          </div>
        ))}
        <div className="relative container-shell flex min-h-[220px] flex-col justify-end py-8 md:min-h-[320px] md:py-12">
          <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-90">
            {slide.eyebrow}
          </p>
          <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight md:text-5xl">
            {slide.title}
          </h1>
          <div className="mt-5">
            <Link
              href={slide.href}
              className="inline-flex rounded-[var(--radius-sm)] bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              {slide.ctaLabel}
            </Link>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous slide"
        className="absolute top-1/2 left-3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white hover:bg-black/55 md:flex"
        onClick={() =>
          setIndex((prev) => (prev - 1 + slides.length) % slides.length)
        }
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        className="absolute top-1/2 right-3 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-xl text-white hover:bg-black/55 md:flex"
        onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
      >
        ›
      </button>
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {slides.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 w-2.5 rounded-full ${
              i === index ? "bg-white" : "bg-white/40"
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
