"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

const SHOPPER_GROUPS: NavGroup[] = [
  {
    label: "Shopping",
    links: [
      { href: "/account", label: "Overview", exact: true },
      { href: "/orders", label: "Your Orders" },
      { href: "/account/buy-again", label: "Buy Again" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/account/returns", label: "Returns" },
    ],
  },
  {
    label: "Account settings",
    links: [
      { href: "/account/profile", label: "Login & security" },
      { href: "/account/addresses", label: "Addresses" },
      { href: "/account/business", label: "Business" },
    ],
  },
  {
    label: "Payments & savings",
    links: [
      { href: "/account/payments", label: "Payments" },
      { href: "/account/coupons", label: "Coupons" },
      { href: "/account/spend", label: "Spend" },
    ],
  },
  {
    label: "Activity & help",
    links: [
      { href: "/account/reviews", label: "Reviews" },
      { href: "/account/notifications", label: "Notifications" },
      { href: "/support", label: "Help" },
    ],
  },
];

/** Sellers only hit /account for login & security — never shopper Buy Again. */
const SELLER_GROUPS: NavGroup[] = [
  {
    label: "Account settings",
    links: [{ href: "/account/profile", label: "Login & security" }],
  },
];

function linkIsActive(pathname: string, link: NavLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function AccountNav({
  displayName,
  mode = "shopper",
}: {
  displayName: string;
  /** Seller staff see login/security only — no Buy Again / shopper rail. */
  mode?: "shopper" | "seller";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const groups = mode === "seller" ? SELLER_GROUPS : SHOPPER_GROUPS;
  const isSeller = mode === "seller";

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 md:block">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {isSeller ? "Seller account" : "Your account"}
          </p>
          <p className="font-semibold">{displayName}</p>
          <Link
            href={isSeller ? "/seller" : "/"}
            className="mt-1 inline-block text-xs text-muted hover:text-accent"
          >
            {isSeller ? "Back to Seller Central" : "Continue shopping"}
          </Link>
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
        aria-label="Account"
        className={`${open ? "flex" : "hidden"} mt-3 flex-col gap-4 md:flex`}
      >
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-muted uppercase">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.links.map((link) => {
                const active = linkIsActive(pathname, link);
                return (
                  <Link
                    key={`${link.href}-${link.label}`}
                    href={link.href}
                    className={`rounded-[var(--radius-sm)] px-3 py-2 text-sm ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "hover:bg-accent-soft/60"
                    }`}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
