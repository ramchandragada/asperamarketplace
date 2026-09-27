"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const LINKS = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/catalogue", label: "Products" },
  { href: "/seller/fulfilment", label: "Orders" },
  { href: "/seller/catalogue", label: "Inventory" },
  { href: "/seller/fulfilment", label: "Returns" },
  { href: "/seller/finance", label: "Finance" },
  { href: "/seller/compliance", label: "Tax / compliance" },
  { href: "/seller/profile", label: "Store profile" },
  { href: "/seller/analytics", label: "Analytics" },
  { href: "/seller/onboarding", label: "KYC / settings" },
] as const;

export function SellerNav({
  sellerName,
  capabilities,
}: {
  sellerName: string;
  capabilities: {
    catalogue: boolean;
    fulfilment: boolean;
    returns: boolean;
    finance: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  const visible = LINKS.filter((link) => {
    if (link.label === "Products" || link.label === "Inventory") {
      return capabilities.catalogue;
    }
    if (link.label === "Orders") return capabilities.fulfilment;
    if (link.label === "Returns") return capabilities.returns;
    if (link.label === "Finance") return capabilities.finance;
    return true;
  });

  return (
    <div className="border-b border-border bg-surface md:border-0 md:bg-transparent">
      <div className="flex items-center justify-between gap-3 py-3 md:block">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Seller
          </p>
          <p className="font-semibold">{sellerName}</p>
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
        className={`${open ? "flex" : "hidden"} flex-col gap-1 pb-3 md:flex`}
      >
        {visible.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-accent-soft/60"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <div className="mt-2 px-3">
          <Badge tone="info">Server-enforced roles</Badge>
        </div>
      </nav>
    </div>
  );
}
