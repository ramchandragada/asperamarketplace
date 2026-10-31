"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelAccountMenu } from "@/components/panel-account-menu";

type NavBadgeKey = "orders" | "returns" | "inventory" | "products";

const LINKS: Array<{
  href: string;
  label: string;
  exact?: boolean;
  capability?: "catalogue" | "fulfilment" | "returns" | "finance";
  badge?: NavBadgeKey;
}> = [
  { href: "/seller", label: "Dashboard", exact: true },
  {
    href: "/seller/catalogue",
    label: "Products",
    capability: "catalogue",
    badge: "products",
  },
  {
    href: "/seller/inventory",
    label: "Inventory",
    capability: "catalogue",
    badge: "inventory",
  },
  {
    href: "/seller/fulfilment",
    label: "Orders",
    capability: "fulfilment",
    badge: "orders",
  },
  {
    href: "/seller/returns",
    label: "Returns",
    capability: "returns",
    badge: "returns",
  },
  { href: "/seller/finance", label: "Finance", capability: "finance" },
  { href: "/seller/compliance", label: "Tax / compliance" },
  { href: "/seller/profile", label: "Store profile" },
  { href: "/seller/analytics", label: "Analytics", capability: "finance" },
  { href: "/seller/onboarding", label: "KYC / settings" },
];

export function SellerNav({
  sellerName,
  displayName,
  showAdmin,
  capabilities,
  badges = {},
}: {
  sellerName: string;
  displayName: string;
  showAdmin: boolean;
  capabilities: {
    catalogue: boolean;
    fulfilment: boolean;
    returns: boolean;
    finance: boolean;
  };
  badges?: Partial<Record<NavBadgeKey, number>>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = LINKS.filter((link) => {
    if (!link.capability) return true;
    return capabilities[link.capability];
  });

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-3 shadow-[var(--shadow-card)] md:border-border">
      <div className="flex items-center justify-between gap-3 md:block">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Seller
          </p>
          <p className="font-semibold">{sellerName}</p>
          <Link
            href="/"
            className="mt-1 inline-block text-xs text-muted hover:text-accent"
          >
            View storefront
          </Link>
          <PanelAccountMenu
            displayName={displayName}
            showSeller
            showAdmin={showAdmin}
          />
        </div>
        <button
          type="button"
          className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>
      <nav
        aria-label="Seller"
        className={`${open ? "flex" : "hidden"} mt-3 flex-col gap-1 md:flex`}
      >
        {visible.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
          const count = link.badge ? badges[link.badge] ?? 0 : 0;
          return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={`flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm ${
                active
                  ? "bg-accent-soft font-medium text-accent"
                  : "hover:bg-accent-soft/60"
              }`}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span>{link.label}</span>
              {count > 0 ? (
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10.5px] font-bold ${
                    link.badge === "orders" || link.badge === "inventory"
                      ? "bg-danger-soft text-danger"
                      : "bg-warning-soft text-warning"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
