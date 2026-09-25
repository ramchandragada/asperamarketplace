"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductGallery({
  title,
  images,
}: {
  title: string;
  images: Array<{ id: string; url: string; altText: string; isPrimary: boolean }>;
}) {
  const [active, setActive] = useState(images[0]?.id ?? "");
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const current =
    images.find((image) => image.id === active) ?? images[0] ?? null;
  const showImage = current && !failed[current.id];
  const initials = title.slice(0, 1).toUpperCase();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-accent-soft via-surface to-warning-soft/50 shadow-[var(--shadow-card)]">
        {showImage ? (
          <Image
            src={current.url}
            alt={current.altText || title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
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
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2" aria-label="Product images">
          {images.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActive(image.id)}
                className={`relative aspect-square w-full overflow-hidden rounded-[var(--radius-sm)] border ${
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
                    sizes="120px"
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
    </div>
  );
}
