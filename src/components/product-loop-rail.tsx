"use client";

import { useEffect, useRef, type ReactNode } from "react";

type LoopItem = {
  id: string;
};

/**
 * Horizontal product rail: wide cards, no scrollbar, finger/trackpad swipe,
 * and a seamless loop so a longer catalogue feels continuous.
 */
export function ProductLoopRail<T extends LoopItem>({
  items,
  renderItem,
  label = "Product carousel",
  variant = "wide",
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  label?: string;
  /** `wide` for product/seller cards; `category` for larger square tiles */
  variant?: "wide" | "category";
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loopingRef = useRef(false);

  // Triple the list so we can jump between identical segments without a seam.
  const copies = items.length > 1 ? 3 : 1;
  const loopItems =
    copies === 1
      ? items.map((item) => ({ item, key: item.id }))
      : Array.from({ length: copies }, (_, copy) =>
          items.map((item) => ({
            item,
            key: `${item.id}-c${copy}`,
          })),
        ).flat();

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || items.length < 2) return;

    function segmentWidth() {
      // One catalogue pass ≈ one third of the full scroll width.
      return node!.scrollWidth / 3;
    }

    function centerOnMiddle() {
      const width = segmentWidth();
      if (width <= 0) return;
      loopingRef.current = true;
      node!.scrollLeft = width;
      requestAnimationFrame(() => {
        loopingRef.current = false;
      });
    }

    centerOnMiddle();

    function onScroll() {
      if (loopingRef.current) return;
      const width = segmentWidth();
      if (width <= 0) return;
      const x = node!.scrollLeft;
      // Jump by one segment when the user nears either end.
      if (x <= width * 0.05) {
        loopingRef.current = true;
        node!.scrollLeft = x + width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
        });
      } else if (x >= width * 1.95) {
        loopingRef.current = true;
        node!.scrollLeft = x - width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
        });
      }
    }

    node.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", centerOnMiddle);
    return () => {
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", centerOnMiddle);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`product-loop-rail hide-scroll touch-pan-x ${
        variant === "category" ? "product-loop-rail--category" : ""
      }`}
    >
      {loopItems.map(({ item, key }) => (
        <div key={key} className="product-loop-rail__card">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
