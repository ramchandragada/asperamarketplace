"use client";

import Link from "next/link";

type Tile = {
  href: string;
  title: string;
  blurb: string;
  group: "shopping" | "account" | "money" | "activity";
};

const TILES: Tile[] = [
  {
    href: "/orders",
    title: "Your Orders",
    blurb: "Track, return, cancel, or buy things again.",
    group: "shopping",
  },
  {
    href: "/account/buy-again",
    title: "Buy Again",
    blurb: "Reorder items from past purchases.",
    group: "shopping",
  },
  {
    href: "/wishlist",
    title: "Wishlist",
    blurb: "Saved products for later.",
    group: "shopping",
  },
  {
    href: "/account/returns",
    title: "Returns",
    blurb: "See return requests and their status.",
    group: "shopping",
  },
  {
    href: "/account/profile",
    title: "Login & security",
    blurb: "Edit your name and account details.",
    group: "account",
  },
  {
    href: "/account/addresses",
    title: "Your Addresses",
    blurb: "Add, edit, or remove delivery addresses.",
    group: "account",
  },
  {
    href: "/account/business",
    title: "Business settings",
    blurb: "GSTIN, tax invoice preference, purchase defaults.",
    group: "account",
  },
  {
    href: "/account/payments",
    title: "Payment options",
    blurb: "Mock pay today · saved UPI/cards after Razorpay.",
    group: "money",
  },
  {
    href: "/account/coupons",
    title: "My Coupons",
    blurb: "Available, used, and expired discount codes.",
    group: "money",
  },
  {
    href: "/account/spend",
    title: "Spend analytics",
    blurb: "Download order reports and analyse spend.",
    group: "money",
  },
  {
    href: "/account/reviews",
    title: "My Reviews & Ratings",
    blurb: "Pending ratings and reviews you have written.",
    group: "activity",
  },
  {
    href: "/account/notifications",
    title: "All Notifications",
    blurb: "Order and account messages in one place.",
    group: "activity",
  },
  {
    href: "/support",
    title: "Help & support",
    blurb: "Open a ticket or ask about an order.",
    group: "activity",
  },
];

const GROUP_LABEL: Record<Tile["group"], string> = {
  shopping: "Shopping",
  account: "Account settings",
  money: "Payments & savings",
  activity: "Activity & help",
};

export function AccountHub() {
  const groups = (["shopping", "account", "money", "activity"] as const).map(
    (key) => ({
      key,
      label: GROUP_LABEL[key],
      tiles: TILES.filter((tile) => tile.group === key),
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.tiles.map((tile) => (
              <Link
                key={tile.href + tile.title}
                href={tile.href}
                className="flex flex-col gap-1 rounded-[var(--radius)] border border-border bg-surface p-4 transition hover:border-accent/40 hover:bg-accent-soft/40"
              >
                <span className="font-semibold text-foreground">
                  {tile.title}
                </span>
                <span className="text-sm text-muted">{tile.blurb}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
