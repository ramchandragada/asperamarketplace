"use client";

import Image from "next/image";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

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
  const [pinchScale, setPinchScale] = useState(1);
  const [pinchOrigin, setPinchOrigin] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement>(null);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef(1);
  const current =
    images.find((image) => image.id === active) ?? images[0] ?? null;
  const showImage = current && !failed[current.id];
  const initials = title.slice(0, 1).toUpperCase();
  const desktopZoom = Boolean(zoom && pinchScale <= 1 && showImage);

  const touchDistance = useCallback((touches: ReactTouchEvent["touches"]) => {
    const a = touches.item(0);
    const b = touches.item(1);
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }, []);

  function updateZoomFromPoint(clientX: number, clientY: number) {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    setZoom({ x, y });
  }

  function onTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      pinchStartDist.current = touchDistance(event.touches);
      pinchStartScale.current = pinchScale;
      const rect = mainRef.current?.getBoundingClientRect();
      const a = event.touches.item(0);
      const b = event.touches.item(1);
      if (rect && a && b) {
        setPinchOrigin({
          x: (((a.clientX + b.clientX) / 2 - rect.left) / rect.width) * 100,
          y: (((a.clientY + b.clientY) / 2 - rect.top) / rect.height) * 100,
        });
      }
    }
  }

  function onTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2 && pinchStartDist.current) {
      const dist = touchDistance(event.touches);
      setPinchScale(
        Math.min(
          3,
          Math.max(1, (dist / pinchStartDist.current) * pinchStartScale.current),
        ),
      );
    }
  }

  function onTouchEnd() {
    if (pinchScale < 1.08) setPinchScale(1);
    pinchStartDist.current = null;
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    updateZoomFromPoint(event.clientX, event.clientY);
  }

  return (
    <div className="relative z-10 flex flex-col gap-3 overflow-visible lg:flex-row">
      {images.length > 1 ? (
        <ul
          className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:w-16 lg:flex-col lg:overflow-visible"
          aria-label="Product images"
        >
          {images.map((image) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActive(image.id);
                  setPinchScale(1);
                }}
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

      <div className="relative order-1 flex-1 overflow-visible lg:order-2">
        <div
          ref={mainRef}
          className="relative aspect-square cursor-crosshair touch-pinch-zoom overflow-hidden rounded-[var(--radius)] border border-border bg-accent-soft/40 shadow-[var(--shadow-card)]"
          onPointerMove={onPointerMove}
          onPointerEnter={onPointerMove}
          onPointerLeave={() => setZoom(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {showImage ? (
            <div
              className="absolute inset-0 transition-transform duration-100 ease-out will-change-transform"
              style={
                pinchScale > 1
                  ? {
                      transform: `scale(${pinchScale})`,
                      transformOrigin: `${pinchOrigin.x}% ${pinchOrigin.y}%`,
                    }
                  : desktopZoom && zoom
                    ? {
                        transform: "scale(2)",
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }
                    : undefined
              }
            >
              <Image
                src={current.url}
                alt={current.altText || title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0iI2U4ZjRmNCIvPjwvc3ZnPg=="
                className="object-cover"
                onError={() =>
                  setFailed((prev) => ({ ...prev, [current.id]: true }))
                }
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl font-semibold text-accent/25" aria-hidden>
                {initials}
              </span>
            </div>
          )}
          {desktopZoom && zoom ? (
            <div
              className="pointer-events-none absolute hidden rounded-[var(--radius-sm)] border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)] lg:block"
              style={{
                width: "30%",
                height: "30%",
                left: `clamp(0.5rem, ${zoom.x}% - 15%, calc(100% - 30% - 0.5rem))`,
                top: `clamp(0.5rem, ${zoom.y}% - 15%, calc(100% - 30% - 0.5rem))`,
              }}
              aria-hidden
            />
          ) : null}
        </div>

        {desktopZoom && zoom && current ? (
          <div
            className="pointer-events-none absolute top-0 left-[calc(100%+0.75rem)] z-40 hidden h-full w-[min(20rem,36vw)] overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-[var(--shadow-mega)] lg:block"
            aria-hidden
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${current.url})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "220%",
                backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              }}
            />
          </div>
        ) : null}

        {pinchScale > 1.05 ? (
          <button
            type="button"
            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white lg:hidden"
            onClick={() => setPinchScale(1)}
          >
            Reset zoom
          </button>
        ) : null}
      </div>
    </div>
  );
}
