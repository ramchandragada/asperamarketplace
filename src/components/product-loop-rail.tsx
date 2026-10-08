"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type LoopItem = {
  id: string;
};

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      aria-hidden
    >
      <path
        d={direction === "right" ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EdgeArrow({
  direction,
  onClick,
  visible,
}: {
  direction: "left" | "right";
  onClick: () => void;
  visible: boolean;
}) {
  return (
    <button
      type="button"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      aria-label={direction === "right" ? "Scroll right" : "Scroll left"}
      onClick={onClick}
      className={`absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#E3E8E8] bg-white text-[#555] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition hover:text-accent hover:shadow-[0_4px_14px_rgba(0,0,0,0.16)] focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:flex ${
        direction === "right" ? "right-1 lg:right-2" : "left-1 lg:left-2"
      } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <Chevron direction={direction} />
    </button>
  );
}

/**
 * Horizontal product rail: wide cards, no scrollbar, finger/trackpad swipe,
 * seamless loop, and Meesho-style circular edge arrows when overflow exists.
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
  /** `wide` for product/seller cards; `category` for square tiles; `brands` for Original Brands cards */
  variant?: "wide" | "category" | "brands";
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const loopingRef = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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

  const updateArrows = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    const overflow = max > 8;
    if (!overflow) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    // Infinite loop rails can always step either way once overflowing.
    if (items.length > 1) {
      setCanPrev(true);
      setCanNext(true);
      return;
    }
    setCanPrev(node.scrollLeft > 8);
    setCanNext(node.scrollLeft < max - 8);
  }, [items.length]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || items.length < 2) {
      updateArrows();
      return;
    }

    function segmentWidth() {
      return node!.scrollWidth / 3;
    }

    function centerOnMiddle() {
      const width = segmentWidth();
      if (width <= 0) return;
      loopingRef.current = true;
      node!.scrollLeft = width;
      requestAnimationFrame(() => {
        loopingRef.current = false;
        updateArrows();
      });
    }

    centerOnMiddle();

    function onScroll() {
      if (loopingRef.current) return;
      const width = segmentWidth();
      if (width <= 0) return;
      const x = node!.scrollLeft;
      if (x <= width * 0.05) {
        loopingRef.current = true;
        node!.scrollLeft = x + width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
          updateArrows();
        });
      } else if (x >= width * 1.95) {
        loopingRef.current = true;
        node!.scrollLeft = x - width;
        requestAnimationFrame(() => {
          loopingRef.current = false;
          updateArrows();
        });
      } else {
        updateArrows();
      }
    }

    node.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", centerOnMiddle);
    updateArrows();
    return () => {
      node.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", centerOnMiddle);
    };
  }, [items, updateArrows]);

  function scrollByPage(direction: 1 | -1) {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector(".product-loop-rail__card");
    const step =
      (card instanceof HTMLElement ? card.offsetWidth : node.clientWidth * 0.7) +
      16;
    node.scrollBy({ left: direction * step * 2, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <EdgeArrow
        direction="left"
        visible={canPrev}
        onClick={() => scrollByPage(-1)}
      />
      <EdgeArrow
        direction="right"
        visible={canNext}
        onClick={() => scrollByPage(1)}
      />
      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={`product-loop-rail hide-scroll ${
          variant === "category"
            ? "product-loop-rail--category"
            : variant === "brands"
              ? "product-loop-rail--brands"
              : ""
        }`}
      >
        {loopItems.map(({ item, key }) => (
          <div key={key} className="product-loop-rail__card">
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Generic horizontal scroller with the same circular edge arrows —
 * use for non-looping rails (e.g. category nav).
 */
export function ScrollEdgeRail({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    if (max <= 8) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(node.scrollLeft > 8);
    setCanNext(node.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    updateArrows();
    node.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateArrows)
        : null;
    ro?.observe(node);
    return () => {
      node.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
      ro?.disconnect();
    };
  }, [updateArrows, children]);

  function scrollByPage(direction: 1 | -1) {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.max(200, node.clientWidth * 0.6),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <EdgeArrow
        direction="left"
        visible={canPrev}
        onClick={() => scrollByPage(-1)}
      />
      <EdgeArrow
        direction="right"
        visible={canNext}
        onClick={() => scrollByPage(1)}
      />
      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        className={className}
      >
        {children}
      </div>
    </div>
  );
}
