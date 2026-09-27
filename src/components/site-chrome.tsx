import Link from "next/link";
import { getOptionalActor } from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";
import { SiteHeaderClient } from "@/components/site-header-client";
import { MEGA_MENU } from "@/lib/mega-menu";
import { readGuestCartToken } from "@/modules/cart/guest";

async function cartCount(userId: string | undefined, guestToken: string | null) {
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
}

export async function SiteHeader() {
  const actor = await getOptionalActor();
  const guestToken = actor ? null : await readGuestCartToken();
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
    title: "Fashion",
    body: "Discover kurtis, sarees, western wear, ethnic sets, and everyday essentials from verified sellers. Shop festive looks and daily staples with size options, ratings, and easy returns.",
    href: "/browse?categorySlug=fashion",
  },
  {
    title: "Electronics and Accessories",
    body: "Browse chargers, earbuds, phone stands, cables, and desk gadgets with transparent pricing. Compare ratings and delivery fees before you check out.",
    href: "/browse?categorySlug=electronics-accessories",
  },
  {
    title: "Home & Kitchen",
    body: "Stock kitchens and living spaces with cookware, storage, cleaning tools, and decor picks. Practical products sized for Indian homes and apartments.",
    href: "/browse?categorySlug=home-kitchen",
  },
  {
    title: "Health, Fitness & Sports",
    body: "Find yoga mats, resistance bands, sports gear, and wellness essentials for home workouts. Beginner-friendly options with clear product details.",
    href: "/browse?categorySlug=health-wellness",
  },
  {
    title: "Office Supplies and Stationery",
    body: "Keep desks organised with pens, folders, organisers, and everyday stationery. Reliable tools for students, WFH setups, and small offices.",
    href: "/browse?categorySlug=stationery-office",
  },
] as const;

const COMMUNITY_BLOCKS = [
  {
    title: "Join the Aspera Community",
    body: "Shop with confidence across categories, follow order updates, and save favourites to your wishlist. A marketplace built for value-seeking Indian households.",
    href: "/shop",
    cta: "Start shopping",
  },
  {
    title: "Download Aspera App Now",
    body: "Get faster discovery, deal alerts, and a smoother checkout experience on mobile. Download the app for exclusive first-order offers.",
    href: "/download-app",
    cta: "Download app",
  },
  {
    title: "More Than Just Shopping",
    body: "Sell to shoppers nationwide with verified listings, transparent fees, and a dedicated seller dashboard. Grow your catalogue on Aspera.",
    href: "/seller/onboarding",
    cta: "Become a Supplier",
  },
] as const;

/** SEO-oriented online shopping directory grouped for footer crawlability. */
const ONLINE_SHOPPING_GROUPS = [
  {
    heading: "Women Ethnicwear",
    links: [
      { label: "Kurtas", href: "/browse?categorySlug=fashion&audience=women&q=kurta" },
      { label: "Sarees", href: "/browse?categorySlug=fashion&audience=women&q=saree" },
      { label: "Lehengas", href: "/browse?categorySlug=fashion&audience=women&q=lehenga" },
      { label: "Dupattas", href: "/browse?categorySlug=fashion&audience=women&q=dupatta" },
      { label: "Palazzo", href: "/browse?categorySlug=fashion&audience=women&q=palazzo" },
    ],
  },
  {
    heading: "Women Western Wear",
    links: [
      { label: "Dresses", href: "/browse?categorySlug=fashion&audience=women&q=dress" },
      { label: "Tops", href: "/browse?categorySlug=fashion&audience=women&q=top" },
      { label: "T-shirts", href: "/browse?categorySlug=fashion&audience=women&q=tee" },
      { label: "Jeans", href: "/browse?categorySlug=fashion&audience=women&q=jean" },
      { label: "Jegging", href: "/browse?categorySlug=fashion&audience=women&q=jegging" },
    ],
  },
  {
    heading: "Women Accessories",
    links: [
      { label: "Scarves", href: "/browse?categorySlug=fashion&audience=women&q=scarf" },
      { label: "Handbags", href: "/browse?categorySlug=bags-footwear&q=sling" },
      { label: "Earrings", href: "/browse?q=earring" },
      { label: "Belts", href: "/browse?categorySlug=bags-footwear&q=belt" },
    ],
  },
  {
    heading: "Women Footwear",
    links: [
      { label: "Sandals", href: "/browse?categorySlug=bags-footwear&q=sandal" },
      { label: "Sneakers", href: "/browse?categorySlug=bags-footwear&q=sneaker" },
      { label: "Slippers", href: "/browse?categorySlug=bags-footwear&q=slipper" },
    ],
  },
  {
    heading: "Men Western Wear",
    links: [
      { label: "Shirts", href: "/browse?categorySlug=fashion&audience=men&q=shirt" },
      { label: "T-shirts", href: "/browse?categorySlug=fashion&audience=men&q=tee" },
      { label: "Jeans", href: "/browse?categorySlug=fashion&audience=men&q=jean" },
      { label: "Trousers", href: "/browse?categorySlug=fashion&audience=men&q=trouser" },
    ],
  },
  {
    heading: "Men Ethnicwear",
    links: [
      { label: "Kurtas", href: "/browse?categorySlug=fashion&audience=men&q=kurta" },
      { label: "Ethnic wear", href: "/browse?categorySlug=fashion&audience=men&q=ethnic" },
    ],
  },
  {
    heading: "Men Accessories",
    links: [
      { label: "Wallets", href: "/browse?categorySlug=bags-footwear&q=wallet" },
      { label: "Belts", href: "/browse?categorySlug=bags-footwear&q=belt" },
      { label: "Caps", href: "/browse?q=cap" },
    ],
  },
  {
    heading: "Men Footwear",
    links: [
      { label: "Sneakers", href: "/browse?categorySlug=bags-footwear&q=sneaker" },
      { label: "Running shoes", href: "/browse?categorySlug=sports-fitness&q=shoe" },
      { label: "Slippers", href: "/browse?categorySlug=bags-footwear&q=slipper" },
    ],
  },
  {
    heading: "Kids",
    links: [
      { label: "Kids hoodies", href: "/browse?categorySlug=baby-kids&audience=kids&q=hoodie" },
      { label: "Onesies", href: "/browse?categorySlug=baby-kids&audience=kids&q=onesie" },
      { label: "Toys", href: "/browse?categorySlug=baby-kids&audience=kids&q=toy" },
      { label: "Kids footwear", href: "/browse?categorySlug=bags-footwear&audience=kids&q=sneaker" },
    ],
  },
  {
    heading: "Baby",
    links: [
      { label: "Swaddles", href: "/browse?categorySlug=baby-kids&audience=kids&q=swaddle" },
      { label: "Feeding", href: "/browse?categorySlug=baby-kids&audience=kids&q=bib" },
      { label: "Soft toys", href: "/browse?categorySlug=baby-kids&audience=kids&q=plush" },
    ],
  },
  {
    heading: "Home & Kitchen",
    links: [
      { label: "Cookware", href: "/browse?categorySlug=home-kitchen&q=tawa" },
      { label: "Storage", href: "/browse?categorySlug=home-kitchen&q=container" },
      { label: "Cleaning", href: "/browse?categorySlug=household-essentials" },
      { label: "Cushions", href: "/browse?categorySlug=home-kitchen&q=cushion" },
    ],
  },
  {
    heading: "Home & Living",
    links: [
      { label: "Laundry", href: "/browse?categorySlug=general-merchandise&q=laundry" },
      { label: "Organisers", href: "/browse?categorySlug=stationery-office" },
      { label: "Decor", href: "/browse?categorySlug=home-kitchen&q=candle" },
    ],
  },
  {
    heading: "Electronics & Accessories",
    links: [
      { label: "Earbuds", href: "/browse?categorySlug=electronics-accessories&q=earbud" },
      { label: "Chargers", href: "/browse?categorySlug=electronics-accessories&q=charger" },
      { label: "Cables", href: "/browse?categorySlug=electronics-accessories&q=cable" },
      { label: "Stands", href: "/browse?categorySlug=electronics-accessories&q=stand" },
    ],
  },
  {
    heading: "Personal Care & Wellness",
    links: [
      { label: "Face wash", href: "/browse?categorySlug=beauty-personal-care&q=face" },
      { label: "Hair oil", href: "/browse?categorySlug=beauty-personal-care&q=oil" },
      { label: "Yoga mats", href: "/browse?categorySlug=health-wellness&q=yoga" },
      { label: "Body lotion", href: "/browse?categorySlug=beauty-personal-care&q=lotion" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-shell grid gap-8 py-10 text-sm md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-bold text-accent">
            Aspera Marketplace
          </p>
          <p className="mt-2 max-w-xs leading-6 text-muted">
            A multi-vendor marketplace for everyday shopping from independent
            Indian sellers — clear pricing, easy discovery, and secure checkout.
          </p>
          <div className="mt-4 space-y-1 text-xs text-muted">
            <p>
              Support:{" "}
              <a
                href="mailto:support@asperamarketplace.example"
                className="font-medium text-accent hover:underline"
              >
                support@asperamarketplace.example
              </a>
            </p>
            <p>
              Phone:{" "}
              <a
                href="tel:+910000000000"
                className="font-medium text-accent hover:underline"
              >
                +91 00000 00000
              </a>{" "}
              <span className="text-muted">(demo contact)</span>
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

      <div className="border-t border-border bg-background/70">
        <div className="container-shell space-y-8 py-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
              Shop with Aspera
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="border-t border-border bg-surface">
        <div className="container-shell py-8">
          <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Online Shopping
          </p>
          <p className="mt-1 text-xs text-muted">
            Browse popular categories and subcategories across Aspera Marketplace.
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

      <div className="border-t border-border bg-background/60">
        <div className="container-shell py-6">
          <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Popular categories
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEGA_MENU.map((entry) => (
              <div key={entry.key}>
                <Link
                  href={entry.href}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {entry.label}
                </Link>
                <ul className="mt-1 space-y-0.5 text-xs text-muted">
                  {entry.columns.flatMap((column) => column.links).slice(0, 5).map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="hover:text-foreground">
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
            <p>© {year} Aspera Marketplace. All rights reserved.</p>
            <p>
              Registered entity (demo): Aspera Marketplace Private Limited ·
              India
            </p>
          </div>
          <p className="flex flex-wrap gap-3">
            <Link href="/support" className="hover:text-foreground">
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
