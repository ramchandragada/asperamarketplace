"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Seller/admin panels share the root layout; soft nav from the storefront
 * would otherwise keep SiteHeader / footer / mobile tabs mounted. */
export function isOperatorPanelPath(pathname: string) {
  return (
    pathname === "/seller" ||
    pathname.startsWith("/seller/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export function ShopperChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (isOperatorPanelPath(pathname)) return null;
  return children;
}

export function ShopperContentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const panel = isOperatorPanelPath(pathname);
  return (
    <div
      id="content"
      tabIndex={-1}
      className={panel ? "flex-1" : "flex-1 pb-[5.75rem] md:pb-0"}
    >
      {children}
    </div>
  );
}
