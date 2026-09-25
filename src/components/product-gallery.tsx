"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: Array<{ id: string; url: string; altText: string; isPrimary: boolean }>;
}) {
  const [active, setActive] = useState(images[0]?.id ?? "");
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const current =
    images.find((image) => image.id === active) ?? images[0] ?? null;
  const showImage = current && !failed[current.id];
  const initials = title.slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      {images.length > 1 ? (
        <ul
          className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:w-16 lg:flex-col lg:overflow-visible"
          aria-label="Product images"
        >
          {images.map((image) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(image.id)}
                className={`relative h-16 w-16 overflow-hidden rounded-[var(--radius-sm)] border ${
                  active === image.id ? "border-accent" : "border-border"
                }`}
                aria-label={image.altText}
                aria-pressed={active === image.id}
              >
                {!failed[image.id] ? (
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    onError={() =>
                      setFailed((prev) => ({ ...prev, [image.id]: true }))
                    }
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-xs text-muted">
                    N/A
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative order-1 flex-1 lg:order-2">
        <div
          ref={mainRef}
          className="relative aspect-square overflow-hidden rounded-[var(--radius)] border border-border bg-accent-soft/40 shadow-[var(--shadow-card)]"
          onMouseMove={(event) => {
            const rect = mainRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            setZoom({ x, y });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {showImage ? (
            <Image
              src={current.url}
              alt={current.altText || title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-cover transition duration-150 ${
                zoom ? "scale-[1.65]" : "scale-100"
              }`}
              style={
                zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined
              }
              onError={() =>
                setFailed((prev) => ({ ...prev, [current.id]: true }))
              }
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-semibold text-accent/25" aria-hidden>
                {initials}
              </span>
            </div>
          )}
          {zoom && showImage ? (
            <div
              className="pointer-events-none absolute inset-4 hidden rounded-[var(--radius-sm)] border-2 border-white/80 shadow-lg lg:block"
              style={{
                width: "28%",
                height: "28%",
                left: `clamp(1rem, ${zoom.x}% - 14%, calc(100% - 28% - 1rem))`,
                top: `clamp(1rem, ${zoom.y}% - 14%, calc(100% - 28% - 1rem))`,
              }}
              aria-hidden
            />
          ) : null}
        </div>
        {zoom && showImage ? (
          <div
            className="pointer-events-none absolute top-0 left-[calc(100%+1rem)] hidden h-full w-[min(22rem,40vw)] overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-mega)] xl:block"
            aria-hidden
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${current.url})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "250%",
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
