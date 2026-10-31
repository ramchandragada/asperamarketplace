"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelAccountMenu } from "@/components/panel-account-menu";

type NavBadgeKey = "orders" | "returns" | "inventory" | "products";

const SECTIONS: Array<{
  title: string;
  links: Array<{
    href: string;
    label: string;
    exact?: boolean;
    capability?: "catalogue" | "fulfilment" | "returns" | "finance";
    badge?: NavBadgeKey;
  }>;
}> = [
  {
    title: "Overview",
    links: [{ href: "/seller", label: "Dashboard", exact: true }],
  },
  {
    title: "Orders",
    links: [
      {
        href: "/seller/fulfilment",
        label: "Manage orders",
        capability: "fulfilment",
        badge: "orders",
      },
      {
        href: "/seller/returns",
        label: "Returns",
        capability: "returns",
        badge: "returns",
      },
    ],
  },
  {
    title: "Catalogue",
    links: [
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
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/seller/finance", label: "Payments", capability: "finance" },
      { href: "/seller/analytics", label: "Analytics", capability: "finance" },
      { href: "/seller/compliance", label: "Tax / GST" },
      { href: "/seller/profile", label: "Store profile" },
      { href: "/seller/onboarding", label: "KYC / settings" },
    ],
  },
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

  const capOk = (capability?: "catalogue" | "fulfilment" | "returns" | "finance") => {
    if (!capability) return true;
    return capabilities[capability];
  };

  return (
    <div className="border border-border bg-surface md:border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 md:block md:px-3.5">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
            Selling as
          </p>
          <p className="mt-0.5 text-[14px] font-semibold leading-tight">
            {sellerName}
          </p>
          <Link
            href="/"
            className="mt-1 inline-block text-[11.5px] text-muted hover:text-foreground"
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
          className="border border-border px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
      </div>
      <nav
        aria-label="Seller Central"
        className={`${open ? "flex" : "hidden"} flex-col gap-3 px-2 py-3 md:flex`}
      >
        {SECTIONS.map((section) => {
          const links = section.links.filter((link) => capOk(link.capability));
          if (links.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="px-2 pb-1 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {links.map((link) => {
                  const active =
                    "exact" in link && link.exact
                      ? pathname === link.href
                      : pathname === link.href ||
                        pathname.startsWith(`${link.href}/`);
                  const count = link.badge ? badges[link.badge] ?? 0 : 0;
                  const showBadge = count > 0;
                  return (
                    <Link
                      key={`${link.href}-${link.label}`}
                      href={link.href}
                      className={`flex items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-[13px] ${
                        active
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "hover:bg-accent-soft"
                      }`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span>{link.label}</span>
                      {showBadge ? (
                        <span
                          className={`min-w-5 rounded-sm px-1.5 py-0.5 text-center text-[10.5px] font-bold ${
                            active
                              ? "bg-white/20 text-white"
                              : link.badge === "orders" ||
                                  link.badge === "inventory"
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
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
