import Link from "next/link";
import { getOptionalActor } from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";
import { SiteHeaderClient } from "@/components/site-header-client";
import { MEGA_MENU } from "@/lib/mega-menu";

async function cartCount(userId: string | undefined) {
  if (!userId) return 0;
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "open" },
    include: { items: true },
  });
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function SiteHeader() {
  const actor = await getOptionalActor();
  const count = await cartCount(actor?.userId);
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
      sellHref={hasSellerRole || actor ? "/seller" : "/seller/onboarding"}
      showAdmin={isAdmin}
    />
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-shell grid gap-8 py-10 text-sm md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-display text-lg font-bold text-accent">Aspera Marketplace</p>
          <p className="mt-2 max-w-xs leading-6 text-muted">
            India&apos;s trusted multi-vendor marketplace for quality products at the
            best prices.
          </p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-foreground uppercase">
            Follow us
          </p>
          <ul className="mt-2 flex flex-wrap gap-3 text-muted">
            {["Instagram", "Facebook", "Twitter", "YouTube"].map((network) => (
              <li key={network}>
                <span className="hover:text-accent">{network}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Shop</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/browse" className="hover:text-accent">
                All categories
              </Link>
            </li>
            <li>
              <Link href="/browse?sort=newest" className="hover:text-accent">
                New arrivals
              </Link>
            </li>
            <li>
              <Link href="/browse" className="hover:text-accent">
                Deals
              </Link>
            </li>
            <li>
              <Link href="/browse" className="hover:text-accent">
                Trending
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Customer care</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/support" className="hover:text-accent">
                Help centre
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-accent">
                Return policy
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-accent">
                Track order
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-accent">
                Shipping info
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">About Aspera</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/support" className="hover:text-accent">
                About us
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-accent">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-accent">
                Press
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Sell on Aspera</p>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>
              <Link href="/seller/onboarding" className="hover:text-accent">
                Start selling
              </Link>
            </li>
            <li>
              <Link href="/seller" className="hover:text-accent">
                Seller dashboard
              </Link>
            </li>
            <li>
              <Link href="/seller/onboarding" className="hover:text-accent">
                Seller policies
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-background/60">
        <div className="container-shell py-6">
          <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
            Popular categories
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEGA_MENU.slice(0, 8).map((entry) => (
              <div key={entry.key}>
                <Link href={entry.href} className="text-sm font-medium text-accent">
                  {entry.label}
                </Link>
                <ul className="mt-1 space-y-0.5 text-xs text-muted">
                  {entry.columns[0]?.links.slice(0, 4).map((link) => (
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
          <p>© {year} Aspera Marketplace. All rights reserved.</p>
          <p className="flex flex-wrap gap-3">
            <Link href="/support" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Shipping policy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
