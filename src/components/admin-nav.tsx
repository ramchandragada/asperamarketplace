"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PanelAccountMenu } from "@/components/panel-account-menu";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/trust", label: "Trust & safety" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export function AdminNav({
  adminName,
  showSeller,
}: {
  adminName: string;
  showSeller: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-surface md:border-0 md:bg-transparent">
      <div className="flex items-center justify-between gap-3 py-3 md:block">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Admin
          </p>
          <p className="font-semibold">{adminName}</p>
          <Link
            href="/"
            className="mt-1 inline-block text-xs text-muted hover:text-accent"
          >
            View storefront
          </Link>
          <PanelAccountMenu
            displayName={adminName}
            showSeller={showSeller}
            showAdmin
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
        aria-label="Admin"
        className={`${open ? "flex" : "hidden"} flex-col gap-1 pb-3 md:flex`}
      >
        {LINKS.map((link) => {
          const active =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
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
      </nav>
    </div>
  );
}
