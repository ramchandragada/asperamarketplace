import Link from "next/link";
import { getOptionalActor } from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";
import { SiteHeaderClient } from "@/components/site-header-client";
import { readGuestCartToken } from "@/modules/cart/guest";
import { releaseExpiredCheckoutReservations } from "@/modules/cart/reservations";
import { siteContact } from "@/platform/config/site-contact";

async function cartCount(userId: string | undefined, guestToken: string | null) {
  try {
    await releaseExpiredCheckoutReservations(
      userId ? { userId } : undefined,
    );
    const cart = userId
      ? await prisma.cart.findFirst({
          where: { userId, status: "open" },
          include: { items: true },
        })
      : guestToken
        ? await prisma.cart.findFirst({
            where: { guestToken, status: "open" },
            include: { items: true },
          })
        : null;
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  } catch {
    // Never let a cart/DB blip take down every page via the shared header.
    return 0;
  }
}

export async function SiteHeader() {
  let actor: Awaited<ReturnType<typeof getOptionalActor>> = null;
  try {
    actor = await getOptionalActor();
  } catch {
    actor = null;
  }

  let guestToken: string | null = null;
  try {
    guestToken = actor ? null : await readGuestCartToken();
  } catch {
    guestToken = null;
  }

  const count = await cartCount(actor?.userId, guestToken);
  const isAdmin = actor ? actorIsAdmin(actor) : false;
  const hasSellerRole =
    actor?.roles.some((role) =>
      [
        "seller_owner",
        "seller_operations",
        "seller_finance",
        "seller_support",
      ].includes(role.key),
    ) ?? false;

  return (
    <SiteHeaderClient
      cartCount={count}
      accountHref={actor ? "/account" : "/login"}
      accountLabel={actor ? "Account" : "Account"}
      sellHref={hasSellerRole || actor ? "/seller" : "/sell"}
      showAdmin={isAdmin}
    />
  );
}

const SEO_BLOCKS = [
  {
    title: "Processors (CPUs)",
    body: "Shop the latest Intel Core and AMD Ryzen desktop processors — from value builds to high-core gaming and workstation chips. Compare cores, clock speeds, and sockets from trusted Pune sellers.",
    href: "/browse?categorySlug=processors",
  },
  {
    title: "Graphics Cards (GPUs)",
    body: "Find NVIDIA GeForce RTX and AMD Radeon graphics cards for gaming, content creation, and AI workloads. Compare VRAM and boost clocks across ASUS, MSI, and Gigabyte.",
    href: "/browse?categorySlug=graphics-cards",
  },
  {
    title: "Motherboards",
    body: "Intel LGA1700 and AMD AM5 motherboards with DDR5, PCIe Gen5, and Wi-Fi. Match your CPU with the right chipset and form factor, delivered across Pune.",
    href: "/browse?categorySlug=motherboards",
  },
  {
    title: "Memory & Storage",
    body: "DDR4 and DDR5 RAM kits plus NVMe Gen4 and SATA SSDs from Corsair, Kingston, Samsung, WD, and Crucial. Speed up your build with the right capacity and latency.",
    href: "/browse?categorySlug=storage-ssd",
  },
  {
    title: "Monitors & Peripherals",
    body: "Gaming and productivity monitors, mechanical keyboards, mice, cabinets, and UPS power backup. Build a complete setup with clear specs and transparent pricing.",
    href: "/browse?categorySlug=monitors",
  },
] as const;

const COMMUNITY_BLOCKS = [
  {
    title: "Join the Aspera Community",
    body: "Follow order updates and save favourites to your wishlist.",
    href: "/shop",
    cta: "Start shopping",
  },
  {
    title: "Download Aspera App Now",
    body: "iOS and Android builds are coming soon.",
    href: "/download-app",
    cta: "Download app",
  },
  {
    title: "More Than Just Shopping",
    body: "Sell to shoppers nationwide with verified listings, transparent fees, and a dedicated seller dashboard.",
    href: "/seller/onboarding",
    cta: "Become a Supplier",
  },
] as const;

/** SEO-oriented online shopping directory grouped for footer crawlability. */
const ONLINE_SHOPPING_GROUPS = [
  {
    heading: "Processors",
    links: [
      { label: "Intel Core i5", href: "/browse?categorySlug=processors&q=core i5" },
      { label: "Intel Core i7", href: "/browse?categorySlug=processors&q=core i7" },
      { label: "AMD Ryzen 5", href: "/browse?categorySlug=processors&q=ryzen 5" },
      { label: "AMD Ryzen 7", href: "/browse?categorySlug=processors&q=ryzen 7" },
    ],
  },
  {
    heading: "Graphics Cards",
    links: [
      { label: "NVIDIA RTX", href: "/browse?categorySlug=graphics-cards&q=rtx" },
      { label: "AMD Radeon", href: "/browse?categorySlug=graphics-cards&q=radeon" },
      { label: "ASUS", href: "/browse?categorySlug=graphics-cards&q=asus" },
      { label: "MSI", href: "/browse?categorySlug=graphics-cards&q=msi" },
    ],
  },
  {
    heading: "Motherboards",
    links: [
      { label: "Intel LGA1700", href: "/browse?categorySlug=motherboards&q=lga1700" },
      { label: "AMD AM5", href: "/browse?categorySlug=motherboards&q=am5" },
      { label: "ASUS", href: "/browse?categorySlug=motherboards&q=asus" },
      { label: "Gigabyte", href: "/browse?categorySlug=motherboards&q=gigabyte" },
    ],
  },
  {
    heading: "Memory (RAM)",
    links: [
      { label: "DDR5", href: "/browse?categorySlug=memory-ram&q=ddr5" },
      { label: "DDR4", href: "/browse?categorySlug=memory-ram&q=ddr4" },
      { label: "Corsair", href: "/browse?categorySlug=memory-ram&q=corsair" },
      { label: "Kingston", href: "/browse?categorySlug=memory-ram&q=kingston" },
    ],
  },
  {
    heading: "Storage (SSD)",
    links: [
      { label: "NVMe Gen4", href: "/browse?categorySlug=storage-ssd&q=nvme" },
      { label: "SATA SSD", href: "/browse?categorySlug=storage-ssd&q=sata" },
      { label: "Samsung", href: "/browse?categorySlug=storage-ssd&q=samsung" },
      { label: "WD", href: "/browse?categorySlug=storage-ssd&q=wd" },
    ],
  },
  {
    heading: "Cabinets",
    links: [
      { label: "Mid Tower", href: "/browse?categorySlug=cabinets&q=mid tower" },
      { label: "ARGB Cabinets", href: "/browse?categorySlug=cabinets&q=argb" },
      { label: "NZXT", href: "/browse?categorySlug=cabinets&q=nzxt" },
      { label: "Ant Esports", href: "/browse?categorySlug=cabinets&q=ant esports" },
    ],
  },
  {
    heading: "Monitors",
    links: [
      { label: "144Hz Gaming", href: "/browse?categorySlug=monitors&q=144hz" },
      { label: "4K UHD", href: "/browse?categorySlug=monitors&q=4k" },
      { label: "LG", href: "/browse?categorySlug=monitors&q=lg" },
      { label: "Acer", href: "/browse?categorySlug=monitors&q=acer" },
    ],
  },
  {
    heading: "Keyboard & Mouse",
    links: [
      { label: "Combos", href: "/browse?categorySlug=keyboard-mouse&q=combo" },
      { label: "Mechanical", href: "/browse?categorySlug=keyboard-mouse&q=mechanical" },
      { label: "Logitech", href: "/browse?categorySlug=keyboard-mouse&q=logitech" },
      { label: "Razer", href: "/browse?categorySlug=keyboard-mouse&q=razer" },
    ],
  },
  {
    heading: "UPS & Power",
    links: [
      { label: "UPS Backup", href: "/browse?categorySlug=ups" },
      { label: "APC", href: "/browse?categorySlug=ups&q=apc" },
      { label: "Zebronics", href: "/browse?categorySlug=ups&q=zebronics" },
    ],
  },
  {
    heading: "Top Brands",
    links: [
      { label: "Intel", href: "/browse?q=intel" },
      { label: "AMD", href: "/browse?q=amd" },
      { label: "NVIDIA", href: "/browse?q=nvidia" },
      { label: "Corsair", href: "/browse?q=corsair" },
      { label: "ASUS", href: "/browse?q=asus" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="container-shell grid gap-8 py-10 text-sm md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-bold text-accent">
            {siteContact.brandName}
          </p>
          <p className="mt-2 max-w-xs leading-6 text-muted">
            Multi-vendor marketplace of independent Indian sellers.
          </p>
          <div className="mt-4 space-y-1 text-xs text-muted">
            <p>
              Support:{" "}
              <a
                href={`mailto:${siteContact.supportEmail}`}
                className="font-medium text-accent hover:underline"
              >
                {siteContact.supportEmail}
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href={`tel:${siteContact.supportPhoneTel}`}
                className="font-medium text-accent hover:underline"
              >
                {siteContact.supportPhoneDisplay}
              </a>
            </p>
            <p>
              <Link href="/buyer-protection" className="font-medium text-accent hover:underline">
                Buyer Protection
              </Link>
            </p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Shop</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/shop" className="hover:text-accent">
                All categories
              </Link>
            </li>
            <li>
              <Link href="/browse?sort=newest" className="hover:text-accent">
                New arrivals
              </Link>
            </li>
            <li>
              <Link
                href="/shop?minDiscountPercent=15"
                className="hover:text-accent"
              >
                Deals
              </Link>
            </li>
            <li>
              <Link href="/shop?sort=rating" className="hover:text-accent">
                Top rated
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Customer care</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/help" className="hover:text-accent">
                Help centre
              </Link>
            </li>
            <li>
              <Link href="/returns" className="hover:text-accent">
                Return policy
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-accent">
                Track order
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="hover:text-accent">
                Shipping info
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-accent">
                Contact support
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-accent">
                Grievance officer
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">About Aspera</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/about" className="hover:text-accent">
                About us
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-accent">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/press" className="hover:text-accent">
                Press
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-accent">
                Careers
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Become a Supplier</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/sell" className="hover:text-accent">
                Start selling
              </Link>
            </li>
            <li>
              <Link href="/seller/onboarding" className="hover:text-accent">
                Seller registration
              </Link>
            </li>
            <li>
              <Link href="/seller" className="hover:text-accent">
                Seller dashboard
              </Link>
            </li>
            <li>
              <Link href="/seller-policies" className="hover:text-accent">
                Seller policies
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* SEO copy: kept in the DOM for crawlers, hidden on mobile to keep the
          footer short (desktop/tablet only). */}
      <div className="hidden border-t border-border bg-background/70 md:block">
        <div className="container-shell space-y-8 py-8">
          <div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {SEO_BLOCKS.map((block) => (
                <article key={block.title} className="text-sm">
                  <Link
                    href={block.href}
                    className="font-semibold text-accent hover:underline"
                  >
                    {block.title}
                  </Link>
                  <p className="mt-1.5 leading-6 text-muted">{block.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-5 border-t border-border/70 pt-6 md:grid-cols-3">
            {COMMUNITY_BLOCKS.map((block) => (
              <article key={block.title} className="text-sm">
                <h3 className="font-semibold text-foreground">{block.title}</h3>
                <p className="mt-1.5 leading-6 text-muted">{block.body}</p>
                <Link
                  href={block.href}
                  className="mt-2 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  {block.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Category sitemap: in the DOM for SEO, hidden on mobile. */}
      <div className="hidden border-t border-border bg-surface md:block">
        <div className="container-shell py-8">
          <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Online Shopping
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {ONLINE_SHOPPING_GROUPS.map((group) => (
              <div key={group.heading}>
                <p className="text-sm font-semibold text-foreground">
                  {group.heading}
                </p>
                <ul className="mt-2 space-y-1 text-xs">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-accent hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-shell flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>© {year} {siteContact.brandName}. All rights reserved.</p>
            <p>
              Registered entity: {siteContact.legalEntity} ·{" "}
              {siteContact.registeredRegion}
            </p>
          </div>
          <p className="flex flex-wrap gap-3">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/shipping" className="hover:text-foreground">
              Shipping policy
            </Link>
            <Link href="/returns" className="hover:text-foreground">
              Returns
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
