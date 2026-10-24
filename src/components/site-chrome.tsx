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
    title: "Processors",
    body: "Shop Intel Core and AMD Ryzen CPUs for gaming, creator, and office builds. Compare sockets, cores, and clear Pune seller pricing before you buy.",
    href: "/browse?categorySlug=processors",
  },
  {
    title: "Graphics cards",
    body: "Browse GeForce RTX and Radeon RX GPUs with transparent MRPs and live stock. From 1080p gaming to 4K creation workloads.",
    href: "/browse?categorySlug=graphics-cards",
  },
  {
    title: "Motherboards & memory",
    body: "Match boards and DDR4/DDR5 kits to your CPU. ASUS, MSI, Gigabyte, Corsair and more from verified sellers.",
    href: "/browse?categorySlug=motherboards",
  },
  {
    title: "Storage, monitors & power",
    body: "NVMe SSDs, high-refresh monitors, cabinets, keyboards, mice, and UPS units sized for Indian homes and Pune power cuts.",
    href: "/browse?categorySlug=storage-ssd",
  },
  {
    title: "Sell PC parts on Aspera",
    body: "List components, manage orders, and reach local builders with verified seller tools for catalogue, fulfilment, and payouts.",
    href: "/seller/onboarding",
  },
] as const;

const COMMUNITY_BLOCKS = [
  {
    title: "Build with Aspera",
    body: "Track orders, save parts to your wishlist, and shop verified Pune sellers.",
    href: "/browse",
    cta: "Browse components",
  },
  {
    title: "Download Aspera App",
    body: "iOS and Android builds are coming soon.",
    href: "/download-app",
    cta: "Download app",
  },
  {
    title: "Become a PC parts seller",
    body: "Sell to builders with verified listings, transparent fees, and a dedicated seller dashboard.",
    href: "/seller/onboarding",
    cta: "Start selling",
  },
] as const;

/** SEO-oriented PC shopping directory for footer crawlability. */
const ONLINE_SHOPPING_GROUPS = [
  {
    heading: "Processors",
    links: [
      { label: "Intel Core", href: "/browse?categorySlug=processors&q=Intel" },
      { label: "AMD Ryzen", href: "/browse?categorySlug=processors&q=Ryzen" },
      { label: "Budget / office", href: "/browse?categorySlug=processors&q=i3" },
      { label: "Gaming (X3D)", href: "/browse?categorySlug=processors&q=X3D" },
      { label: "All processors", href: "/browse?categorySlug=processors" },
    ],
  },
  {
    heading: "Graphics cards",
    links: [
      { label: "GeForce RTX", href: "/browse?categorySlug=graphics-cards&q=RTX" },
      { label: "Radeon RX", href: "/browse?categorySlug=graphics-cards&q=Radeon" },
      { label: "Entry GPUs", href: "/browse?categorySlug=graphics-cards&maxPricePaise=3000000" },
      { label: "All GPUs", href: "/browse?categorySlug=graphics-cards" },
    ],
  },
  {
    heading: "Motherboards",
    links: [
      { label: "AM5 boards", href: "/browse?categorySlug=motherboards&q=AM5" },
      { label: "LGA1700", href: "/browse?categorySlug=motherboards&q=LGA1700" },
      { label: "ASUS", href: "/browse?categorySlug=motherboards&q=ASUS" },
      { label: "MSI", href: "/browse?categorySlug=motherboards&q=MSI" },
      { label: "All boards", href: "/browse?categorySlug=motherboards" },
    ],
  },
  {
    heading: "Memory",
    links: [
      { label: "DDR5 kits", href: "/browse?categorySlug=memory-ram&q=DDR5" },
      { label: "DDR4 kits", href: "/browse?categorySlug=memory-ram&q=DDR4" },
      { label: "Corsair", href: "/browse?categorySlug=memory-ram&q=Corsair" },
      { label: "All memory", href: "/browse?categorySlug=memory-ram" },
    ],
  },
  {
    heading: "Storage",
    links: [
      { label: "NVMe SSD", href: "/browse?categorySlug=storage-ssd&q=NVMe" },
      { label: "SATA SSD", href: "/browse?categorySlug=storage-ssd&q=SATA" },
      { label: "Samsung", href: "/browse?categorySlug=storage-ssd&q=Samsung" },
      { label: "All SSDs", href: "/browse?categorySlug=storage-ssd" },
    ],
  },
  {
    heading: "Monitors",
    links: [
      { label: "144Hz+", href: "/browse?categorySlug=monitors&q=144Hz" },
      { label: "27 inch", href: "/browse?categorySlug=monitors&q=27" },
      { label: "Office", href: "/browse?categorySlug=monitors&q=100Hz" },
      { label: "All monitors", href: "/browse?categorySlug=monitors" },
    ],
  },
  {
    heading: "Cabinets & cooling",
    links: [
      { label: "ATX cases", href: "/browse?categorySlug=cabinets&q=ATX" },
      { label: "Mesh airflow", href: "/browse?categorySlug=cabinets&q=mesh" },
      { label: "CPU coolers", href: "/browse?categorySlug=cpu-coolers" },
      { label: "All cabinets", href: "/browse?categorySlug=cabinets" },
    ],
  },
  {
    heading: "Power supplies",
    links: [
      { label: "Gold modular", href: "/browse?categorySlug=power-supplies&q=Gold" },
      { label: "850W+", href: "/browse?categorySlug=power-supplies&q=850" },
      { label: "All SMPS", href: "/browse?categorySlug=power-supplies" },
    ],
  },
  {
    heading: "Peripherals",
    links: [
      { label: "Keyboard & mouse", href: "/browse?categorySlug=keyboard-mouse" },
      { label: "Logitech", href: "/browse?categorySlug=keyboard-mouse&q=Logitech" },
      { label: "Gaming combos", href: "/browse?categorySlug=keyboard-mouse&q=gaming" },
    ],
  },
  {
    heading: "Power backup",
    links: [
      { label: "UPS 600VA", href: "/browse?categorySlug=ups&q=600VA" },
      { label: "UPS 1000VA+", href: "/browse?categorySlug=ups&q=1000VA" },
      { label: "All UPS", href: "/browse?categorySlug=ups" },
    ],
  },
  {
    heading: "Shop by budget",
    links: [
      { label: "Under ₹5,000", href: "/browse?maxPricePaise=500000" },
      { label: "Under ₹20,000", href: "/browse?maxPricePaise=2000000" },
      { label: "Under ₹50,000", href: "/browse?maxPricePaise=5000000" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="container-shell grid gap-8 py-10 text-sm md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-bold tracking-tight text-accent">
            ASPERA
          </p>
          <p className="mt-2 max-w-xs leading-6 text-muted">
            Pune’s PC components marketplace — CPUs, GPUs, boards, memory, and
            more from verified local sellers with clear pricing and secure
            prepaid checkout.
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
            PC components
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
