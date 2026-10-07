"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function sanitizeSearchQuery(raw: string) {
  const truncated = raw.trim().slice(0, 80);
  return truncated
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/\b[6-9]\d{9}\b/g, "[redacted]");
}

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

function isPanelPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/seller" ||
    pathname.startsWith("/seller/") ||
    pathname.startsWith("/api")
  );
}

/** Fires page_view on shopper navigations; skips admin/seller panels. */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (isPanelPath(pathname)) {
      return;
    }
    const key = `${pathname}?${searchParams.toString()}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const q = searchParams.get("q");
    if (pathname === "/browse" && q) {
      track("search", { searchQuery: sanitizeSearchQuery(q) });
    }
    track("page_view", {
      properties: { path: pathname },
    });
  }, [pathname, searchParams]);

  return null;
}

const viewedProducts = new Set<string>();

export function trackProductView(productId: string) {
  if (viewedProducts.has(productId)) return;
  viewedProducts.add(productId);
  track("product_view", { productId });
}

export function trackAddToCart(productId: string) {
  track("add_to_cart", { productId });
}
