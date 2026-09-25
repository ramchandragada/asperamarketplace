import Link from "next/link";
import { getOptionalActor } from "@/modules/identity/service";
import { actorIsAdmin } from "@/modules/identity/policy";
import { prisma } from "@/platform/db/prisma";

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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="container-shell flex h-[var(--header-height)] items-center gap-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-accent"
        >
          Aspera
        </Link>
        <form
          action="/browse"
          method="get"
          className="hidden min-w-0 flex-1 md:block"
          role="search"
        >
          <label className="sr-only" htmlFor="global-search">
            Search products
          </label>
          <input
            id="global-search"
            name="q"
            type="search"
            placeholder="Search products, categories, sellers"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          />
        </form>
        <nav
          aria-label="Primary"
          className="ml-auto flex items-center gap-1 text-sm sm:gap-2"
        >
          <Link
            href="/browse"
            className="rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-accent-soft/60 sm:px-3"
          >
            Shop
          </Link>
          {hasSellerRole || actor ? (
            <Link
              href="/seller"
              className="rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-accent-soft/60 sm:px-3"
            >
              Sell
            </Link>
          ) : (
            <Link
              href="/seller/onboarding"
              className="rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-accent-soft/60 sm:px-3"
            >
              Sell
            </Link>
          )}
          {isAdmin ? (
            <Link
              href="/admin/sellers"
              className="hidden rounded-[var(--radius-sm)] px-3 py-1.5 hover:bg-accent-soft/60 sm:inline"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/cart"
            className="rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-accent-soft/60 sm:px-3"
          >
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
          <Link
            href={actor ? "/account" : "/login"}
            className="rounded-[var(--radius-sm)] bg-accent px-3 py-1.5 font-medium text-accent-foreground"
          >
            {actor ? "Account" : "Sign in"}
          </Link>
        </nav>
      </div>
      <div className="container-shell pb-3 md:hidden">
        <form action="/browse" method="get" role="search">
          <label className="sr-only" htmlFor="mobile-search">
            Search products
          </label>
          <input
            id="mobile-search"
            name="q"
            type="search"
            placeholder="Search Aspera"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm"
          />
        </form>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-shell grid gap-6 py-10 text-sm text-muted md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-foreground">Aspera Marketplace</p>
          <p className="mt-2 max-w-sm leading-6">
            India-first multi-vendor commerce with verified sellers, transparent
            pricing, and responsible operations. Tax and compliance outputs need
            professional review before production use.
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">Shop</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/browse" className="hover:text-foreground">
                Browse
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-foreground">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-foreground">
                Orders
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-foreground">Trust</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy requests
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-foreground">
                Support
              </Link>
            </li>
            <li>
              <Link href="/seller/onboarding" className="hover:text-foreground">
                Become a seller
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
