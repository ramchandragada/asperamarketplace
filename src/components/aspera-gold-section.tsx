"use client";

import Image from "next/image";
import Link from "next/link";

const GOLD_CATEGORIES = [
  {
    id: "lehengas",
    label: "Lehengas",
    href: "/browse?categorySlug=fashion&q=lehenga",
    imageUrl:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "menwear",
    label: "Menwear",
    href: "/browse?categorySlug=fashion&q=shirt",
    imageUrl:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "sarees",
    label: "Sarees",
    href: "/browse?categorySlug=fashion&q=saree",
    imageUrl:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "jewellery",
    label: "Jewellery",
    href: "/browse?q=earring",
    imageUrl:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=500&q=80",
  },
] as const;

export function AsperaGoldSection() {
  return (
    <section className="relative overflow-hidden border-y border-[#5c3d0f]/40 bg-[linear-gradient(135deg,#1a1208_0%,#3d2a12_40%,#6b4a1e_70%,#2a1a0a_100%)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(232,180,80,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(184,134,11,0.25), transparent 40%)",
        }}
      />
      <div className="container-shell relative grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center md:py-14">
        <div className="flex flex-col gap-4 text-[#f5e6c8]">
          <p className="font-display text-3xl font-semibold tracking-tight text-[#e8b450] md:text-4xl">
            <span aria-hidden>✦ </span>Gold
          </p>
          <h2 className="max-w-md font-display text-2xl font-semibold leading-snug text-[#f8efd8] md:text-3xl">
            Products you Love. Quality we Trust.
          </h2>
          <p className="max-w-sm text-sm leading-6 text-[#d4c4a0]">
            Curated ethnic and festive picks with premium finishes — trusted
            sellers, verified quality.
          </p>
          <Link
            href="/browse?categorySlug=fashion&q=lehenga"
            className="mt-1 inline-flex w-fit items-center rounded-[var(--radius-sm)] bg-[#e8b450] px-5 py-2.5 text-sm font-bold text-[#1a1208] shadow-[0_4px_16px_rgba(232,180,80,0.35)] transition hover:bg-[#f0c56a]"
          >
            Shop Now
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {GOLD_CATEGORIES.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative mx-auto aspect-square w-full max-w-[11rem] overflow-hidden rounded-full border-[3px] border-[#e8b450]/80 shadow-[0_0_0_4px_rgba(232,180,80,0.15),0_8px_24px_rgba(0,0,0,0.35)] transition hover:border-[#f0c56a] sm:max-w-[13rem]"
            >
              <Image
                src={item.imageUrl}
                alt={item.label}
                fill
                sizes="208px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-4 pt-10 text-center text-sm font-bold text-[#f8efd8]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
