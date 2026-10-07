"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function track(eventName: string, payload: Record<string, unknown> = {}) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ eventName, ...payload }),
    keepalive: true,
  }).catch(() => {
    /* ignore analytics failures */
  });
}

/** Fires page_view on shopper navigations; skips admin/seller panels. */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/seller") ||
      pathname.startsWith("/api")
    ) {
      return;
    }
    const key = `${pathname}?${searchParams.toString()}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const q = searchParams.get("q");
    if (pathname === "/browse" && q) {
      track("search", { searchQuery: q });
    }
    track("page_view", {
      properties: { path: pathname },
    });
  }, [pathname, searchParams]);

  return null;
}

export function trackProductView(productId: string) {
  track("product_view", { productId });
}

export function trackAddToCart(productId: string) {
  track("add_to_cart", { productId });
}
