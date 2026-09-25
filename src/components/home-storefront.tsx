"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useSyncExternalStore, type CSSProperties } from "react";

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
        d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z"
        stroke="#9f2089"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5c0-1.2.9-2 2.2-2h1.1c1.1 0 1.9.7 1.9 1.7 0 .9-.5 1.4-1.5 1.7l-1.7.5c-1 .3-1.5.8-1.5 1.7 0 1 .9 1.7 2.1 1.7h1c1.3 0 2.2-.8 2.2-2"
        stroke="#9f2089"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5v1.2M12 16.2V17.5"
        stroke="#9f2089"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}


/** Meesho web homepage hero: purple app campaign + QR */
export function MeeshoAppHero() {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const downloadTarget = origin ? `${origin}/download-app` : "/download-app";
  const qrUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=" +
    encodeURIComponent(downloadTarget);

  const sans = {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  } as const;

  return (
    <section className="relative overflow-hidden bg-[#9f2089] text-white">
      {/* Meesho-style repeating letter watermark */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88'%3E%3Ctext x='18' y='58' font-family='Arial Black,Helvetica,sans-serif' font-size='52' font-weight='900' fill='%23000000'%3Ea%3C/text%3E%3C/svg%3E\")",
          backgroundSize: "88px 88px",
        }}
      />

      <div className="relative container-shell grid min-h-[300px] items-end gap-2 pt-4 pb-0 md:min-h-[380px] md:grid-cols-[1.15fr_0.85fr_1fr] md:items-stretch md:gap-4 md:pt-0 lg:min-h-[420px]">
        {/* Left: rainbow rings + yellow-outfit arched models */}
        <div className="relative z-[1] flex items-end justify-center md:justify-start">
          <div className="relative flex h-full w-full max-w-[460px] items-end justify-center pt-8 md:pt-10">
            {/* rainbow concentric arches behind models */}
            <div
              className="pointer-events-none absolute top-[8%] left-1/2 h-[120%] w-[120%] -translate-x-1/2"
              aria-hidden
            >
              <div className="absolute inset-[6%] rounded-full border-[16px] border-white/70 md:border-[22px]" />
              <div className="absolute inset-[16%] rounded-full border-[16px] border-[#4ec4e8]/85 md:border-[22px]" />
              <div className="absolute inset-[26%] rounded-full border-[16px] border-[#ff7eb6]/80 md:border-[22px]" />
              <div className="absolute inset-[36%] rounded-full border-[14px] border-[#ffc14a]/75 md:border-[18px]" />
              <div className="absolute inset-[46%] rounded-full border-[12px] border-[#e85aad]/70 md:border-[16px]" />
            </div>

            <div className="relative z-[1] flex items-end">
              <div
                className="relative h-[210px] w-[135px] overflow-hidden bg-[#7a1868] sm:h-[250px] sm:w-[155px] md:h-[320px] md:w-[190px] lg:h-[360px] lg:w-[210px]"
                style={{ borderRadius: "999px 999px 0 0" }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1774437787442-d58f8534ba9f?auto=format&fit=crop&w=600&q=80"
                  alt=""
                  fill
                  sizes="210px"
                  className="object-cover object-[center_12%]"
                  priority
                />
              </div>
              <div
                className="relative z-[1] -ml-6 h-[230px] w-[145px] overflow-hidden bg-[#7a1868] sm:-ml-7 sm:h-[270px] sm:w-[165px] md:-ml-9 md:h-[340px] md:w-[200px] lg:h-[380px] lg:w-[220px]"
                style={{ borderRadius: "999px 999px 0 0" }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1734527224906-92eaabc0f665?auto=format&fit=crop&w=600&q=80"
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover object-[center_10%]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center: offer + QR */}
        <div className="relative z-[1] flex flex-col items-center justify-center self-center px-2 pb-6 text-center md:pb-0">
          <p className="text-[15px] font-semibold leading-tight text-white md:text-[17px]" style={sans}>
            Upto{" "}
            <span className="text-[2rem] font-black tracking-tight text-[#ffe566] md:text-[2.35rem]">
              35% OFF
            </span>
          </p>
          <p className="mt-1 text-[15px] font-medium text-white md:text-[17px]" style={sans}>
            on your first order
          </p>
          <p className="mt-0.5 text-[12px] text-white/90">*Only on App</p>
          <div className="mt-5 rounded-[6px] bg-white p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.22)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Scan to download Aspera app"
              width={168}
              height={168}
              className="h-[152px] w-[152px] md:h-[168px] md:w-[168px]"
            />
          </div>
          <p className="mt-3 text-[14px] font-semibold tracking-wide text-white" style={sans}>
            Scan now to install
          </p>
        </div>

        {/* Right: tagline + CTA */}
        <div className="relative z-[1] flex flex-col items-center justify-center gap-6 self-center pb-8 text-center md:items-start md:pb-0 md:pl-6 md:text-left">
          <h1
            className="max-w-[17rem] text-[1.85rem] leading-[1.18] font-bold text-balance md:max-w-[18rem] md:text-[2.15rem] lg:text-[2.4rem]"
            style={sans}
          >
            Smart Shopping
            <br />
            Trusted by Millions
          </h1>
          <Link
            href="/browse"
            className="inline-flex rounded-md bg-white px-11 py-3.5 text-[16px] font-bold text-[#9f2089] shadow-sm transition hover:bg-[#fff5fb]"
            style={sans}
          >
            Shop Now
          </Link>
        </div>
      </div>
    </section>
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
    <div className="border-b border-[#f5d0e6] bg-[#fdeef6]">
      <ul className="container-shell flex flex-wrap items-center justify-center gap-x-1 gap-y-2 py-3 text-[13px] text-[#333] md:py-3.5">
        {items.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center gap-2 px-3 sm:px-6 md:px-8"
          >
            {index > 0 ? (
              <span
                className="mr-2 hidden h-4 w-px bg-[#e5c4d6] sm:block"
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
      <div className="container-shell py-5 md:py-6">
        <ul className="meesho-hide-scroll flex justify-between gap-3 overflow-x-auto pb-0.5 md:gap-4">
          {categories.map((category) => (
            <li
              key={category.id}
              className="min-w-[5.25rem] shrink-0 md:min-w-0 md:flex-1"
            >
              <Link
                href={category.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span
                  className="relative flex h-[5.75rem] w-[5.75rem] items-end justify-center overflow-hidden bg-[#f2eaf8] transition group-hover:bg-[#eadff5] sm:h-[6.75rem] sm:w-[6.75rem] md:h-[7.5rem] md:w-[7.5rem]"
                  style={{ borderRadius: "999px 999px 14px 14px" }}
                >
                  <span className="relative mb-1 h-[88%] w-[82%]">
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-contain object-bottom drop-shadow-sm"
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
        "inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#ff6700] text-[11px] font-bold text-white",
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
        "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0033a0] text-[8px] font-bold tracking-wide text-white",
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
  return (
    <div className="-mx-4 bg-[#f3e8ff] px-4 py-4 md:mx-0 md:rounded-lg md:px-3">
      <div className="meesho-hide-scroll flex gap-3 overflow-x-auto pb-0.5">
        {logos.map((logo) => {
          const style = brandLogoStyle(logo.name);
          return (
            <Link
              key={logo.id}
              href={logo.href}
              className="flex h-11 w-[104px] shrink-0 flex-col items-center justify-center rounded-md bg-white px-2 text-center shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
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
    <section className="border-b border-[#eee] bg-white py-5 md:py-7">
      <div className="container-shell flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[1.15rem] font-bold tracking-tight text-[#333] md:text-[1.35rem]">
            Original Brands
            <span
              className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#9f2089] text-[10px] font-bold text-white"
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
            className="meesho-hide-scroll flex gap-3 overflow-x-auto pb-1 md:gap-3.5"
          >
            {cards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="group relative flex h-[11rem] w-[8.75rem] shrink-0 flex-col overflow-hidden rounded-xl bg-[#ebe4f5] md:h-[12.5rem] md:w-[9.75rem]"
              >
                <span className="relative flex flex-1 items-center justify-center px-2 pt-3">
                  <span className="relative h-full w-full">
                    <Image
                      src={card.imageUrl}
                      alt=""
                      fill
                      sizes="156px"
                      className="object-contain object-center transition duration-300 group-hover:scale-105"
                    />
                  </span>
                </span>
                <span className="bg-[#9f2089] px-2 py-2 text-center text-[12px] font-bold text-white md:text-[13px]">
                  {card.label}
                </span>
              </Link>
            ))}
          </div>
          {cards.length > 4 ? (
            <button
              type="button"
              aria-label="Scroll original brands right"
              className="absolute top-[40%] right-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#eee] bg-white text-lg text-[#333] shadow-md hover:text-[#9f2089]"
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
      <div className="grid overflow-hidden rounded-xl md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)]">
        <div className="relative flex min-h-[240px] flex-col justify-center overflow-hidden bg-[#ff8a1f] px-6 py-8 md:min-h-[300px] md:px-8">
          <p className="text-sm font-semibold text-white/95">Up to</p>
          <p
            className="mt-1 text-[2.85rem] leading-none font-black tracking-tight text-[#5b0a6e] md:text-[3.4rem]"
            style={{
              textShadow:
                "3px 3px 0 #ffe566, -2px -2px 0 #ffe566, 2px -2px 0 #ffe566, -2px 2px 0 #ffe566",
            }}
          >
            35% OFF
          </p>
          <p className="mt-2 text-lg font-bold text-[#5b0a6e]">on first order</p>
          <p className="mt-4 text-sm font-semibold text-[#5b0a6e]">
            *Only on App
          </p>
          <Link
            href="/download-app"
            className="mt-5 inline-flex w-fit rounded-md bg-white px-5 py-2.5 text-sm font-bold text-[#5b0a6e] shadow-sm hover:bg-[#fff8ef]"
          >
            Download Now
          </Link>
        </div>

        <div className="bg-[#9f2089] px-4 py-5 md:px-6 md:py-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3.5">
            {collections.slice(0, 4).map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="group flex flex-col items-center gap-2"
              >
                <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-[#ffe566] bg-[#fff4c8] shadow-sm">
                  <Image
                    src={collection.imageUrl}
                    alt=""
                    fill
                    sizes="160px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-center text-[10px] font-bold text-[#5b0a6e] shadow-sm sm:text-[11px]">
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
